import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../navigation/types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useCategories } from '../hooks/useCategories';
import { useStandards } from '../hooks/useStandards';
import { useActivities } from '../hooks/useActivities';
import { useTheme } from '../theme/useTheme';
import { UNCATEGORIZED_CATEGORY_ID, Activity } from '@minimum-standards/shared-model';
import { useUIPreferencesStore } from '../stores/uiPreferencesStore';

export function CategorySettingsScreen() {
  const MAX_CATEGORY_NAME_LENGTH = 120;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const {
    orderedCategories,
    loading: categoriesLoading,
    error: categoriesError,
    createCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
  } = useCategories();
  const { standards, loading: standardsLoading } = useStandards();
  const { activities, updateActivity, loading: activitiesLoading } = useActivities();
  const { activityCategoryMigrationCompletedAtMs, setActivityCategoryMigrationCompletedAtMs, activityCategoryMigrationConflictActivityIds, setActivityCategoryMigrationConflictActivityIds } = useUIPreferencesStore();
  
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [addActivitiesModalVisible, setAddActivitiesModalVisible] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<string | null>(null);
  const [selectedActivitiesForBulk, setSelectedActivitiesForBulk] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [migrationRunning, setMigrationRunning] = useState(false);

  // Group activities by category
  const activitiesByCategory = useMemo(() => {
    const grouped = new Map<string, Activity[]>();
    activities.forEach((activity) => {
      const categoryId = activity.categoryId ?? UNCATEGORIZED_CATEGORY_ID;
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)!.push(activity);
    });
    // Sort activities within each category by name
    grouped.forEach((activitiesList) => {
      activitiesList.sort((a, b) => a.name.localeCompare(b.name));
    });
    return grouped;
  }, [activities]);

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    activities.forEach((activity) => {
      const categoryId = activity.categoryId ?? UNCATEGORIZED_CATEGORY_ID;
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    });
    return counts;
  }, [activities]);

  // Get activities not in the selected category (for adding)
  const availableActivitiesForCategory = useMemo(() => {
    if (!selectedCategoryForAdd) return [];
    return activities.filter((activity) => {
      const currentCategoryId = activity.categoryId ?? UNCATEGORIZED_CATEGORY_ID;
      return currentCategoryId !== selectedCategoryForAdd;
    });
  }, [activities, selectedCategoryForAdd]);

  // Deterministic migration runner
  const runMigration = useCallback(async () => {
    if (
      activityCategoryMigrationCompletedAtMs !== null ||
      migrationRunning ||
      categoriesLoading ||
      standardsLoading ||
      activitiesLoading
    ) {
      return;
    }

    setMigrationRunning(true);
    try {
      const conflictActivityIds: string[] = [];
      let migratedCount = 0;
      let alreadySetCount = 0;

      // Group standards by activityId
      const standardsByActivityId = new Map<string, typeof standards>();
      standards.forEach((standard) => {
        if (!standardsByActivityId.has(standard.activityId)) {
          standardsByActivityId.set(standard.activityId, []);
        }
        standardsByActivityId.get(standard.activityId)!.push(standard);
      });

      // Process each activity
      for (const activity of activities) {
        // Skip if already has a category assigned (manual assignment)
        if (activity.categoryId !== null && activity.categoryId !== undefined) {
          alreadySetCount++;
          continue;
        }

        const activityStandards = standardsByActivityId.get(activity.id) ?? [];
        
        // Get distinct non-null legacy categoryIds
        const legacyCategoryIds = new Set<string>();
        activityStandards.forEach((standard) => {
          if (standard.categoryId !== null && standard.categoryId !== undefined && standard.categoryId !== '') {
            legacyCategoryIds.add(standard.categoryId);
          }
        });

        // If exactly one legacy category, assign it
        if (legacyCategoryIds.size === 1) {
          const categoryId = Array.from(legacyCategoryIds)[0];
          await updateActivity(activity.id, { categoryId });
          migratedCount++;
        } else if (legacyCategoryIds.size > 1) {
          // Multiple conflicting categories - mark for review
          conflictActivityIds.push(activity.id);
        }
        // If 0 categories, leave as Uncategorized (no action needed)
      }

      // Persist migration completion and conflicts
      setActivityCategoryMigrationCompletedAtMs(Date.now());
      setActivityCategoryMigrationConflictActivityIds(conflictActivityIds);

      console.log(`[Migration] Completed: ${migratedCount} migrated, ${conflictActivityIds.length} conflicts, ${alreadySetCount} already set`);
    } catch (error) {
      console.error('[Migration] Failed:', error);
      Alert.alert('Migration Error', 'Failed to run migration. Please try again.');
    } finally {
      setMigrationRunning(false);
    }
  }, [
    activities,
    standards,
    activityCategoryMigrationCompletedAtMs,
    migrationRunning,
    categoriesLoading,
    standardsLoading,
    activitiesLoading,
    updateActivity,
    setActivityCategoryMigrationCompletedAtMs,
    setActivityCategoryMigrationConflictActivityIds,
  ]);

  // Run migration on mount if needed
  useEffect(() => {
    if (
      activityCategoryMigrationCompletedAtMs === null &&
      !categoriesLoading &&
      !standardsLoading &&
      !activitiesLoading &&
      !migrationRunning
    ) {
      runMigration();
    }
  }, [activityCategoryMigrationCompletedAtMs, categoriesLoading, standardsLoading, activitiesLoading, migrationRunning, runMigration]);

  const resolveMigrationConflict = useCallback((activityId: string) => {
    if (!activityCategoryMigrationConflictActivityIds.length) {
      return;
    }
    const next = activityCategoryMigrationConflictActivityIds.filter((id) => id !== activityId);
    if (next.length !== activityCategoryMigrationConflictActivityIds.length) {
      setActivityCategoryMigrationConflictActivityIds(next);
    }
  }, [activityCategoryMigrationConflictActivityIds, setActivityCategoryMigrationConflictActivityIds]);

  const toggleCategoryExpanded = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCreateCategory = useCallback(async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Category name cannot be empty.');
      return;
    }
    if (trimmedName.length > MAX_CATEGORY_NAME_LENGTH) {
      Alert.alert('Error', `Category name must be ${MAX_CATEGORY_NAME_LENGTH} characters or fewer.`);
      return;
    }

    try {
      setCreatingCategory(true);
      await createCategory({ name: trimmedName });
      setNewCategoryName('');
      Alert.alert('Success', 'Category created successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  }, [newCategoryName, createCategory]);

  const handleStartRename = useCallback((categoryId: string, currentName: string) => {
    setEditingCategoryId(categoryId);
    setEditingName(currentName);
  }, []);

  const handleCancelRename = useCallback(() => {
    setEditingCategoryId(null);
    setEditingName('');
  }, []);

  const handleSaveRename = useCallback(async () => {
    const trimmedName = editingName.trim();
    if (!editingCategoryId || !trimmedName) {
      return;
    }
    if (trimmedName.length > MAX_CATEGORY_NAME_LENGTH) {
      Alert.alert('Error', `Category name must be ${MAX_CATEGORY_NAME_LENGTH} characters or fewer.`);
      return;
    }

    try {
      await renameCategory(editingCategoryId, { name: trimmedName });
      setEditingCategoryId(null);
      setEditingName('');
      Alert.alert('Success', 'Category renamed successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to rename category');
    }
  }, [editingCategoryId, editingName, renameCategory]);

  const handleDeleteCategory = useCallback(
    async (categoryId: string, categoryName: string) => {
      const count = categoryCounts.get(categoryId) ?? 0;

      if (count === 0) {
        // Safe to delete immediately
        Alert.alert(
          'Delete Category',
          `Are you sure you want to delete "${categoryName}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteCategory(categoryId);
                  Alert.alert('Success', 'Category deleted successfully');
                } catch (error) {
                  Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete category');
                }
              },
            },
          ]
        );
      } else {
        // Need reassignment
        Alert.alert(
          'Delete Category',
          `"${categoryName}" has ${count} activit${count === 1 ? 'y' : 'ies'}. Move them to Uncategorized?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Move to Uncategorized',
              onPress: async () => {
                try {
                  // Batch update activities to Uncategorized
                  const affectedActivities = activities.filter(
                    (a) => (a.categoryId ?? UNCATEGORIZED_CATEGORY_ID) === categoryId
                  );
                  // Update activities one by one
                  await Promise.all(
                    affectedActivities.map((activity) =>
                      updateActivity(activity.id, { categoryId: null })
                    )
                  );
                  await deleteCategory(categoryId);
                  Alert.alert('Success', 'Category deleted and activities moved to Uncategorized');
                } catch (error) {
                  Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete category');
                }
              },
            },
          ]
        );
      }
    },
    [categoryCounts, activities, deleteCategory, updateActivity]
  );

  const handleMoveUp = useCallback(
    async (categoryId: string) => {
      const currentIndex = orderedCategories.findIndex((c) => c.id === categoryId);
      if (currentIndex <= 0) return;

      const newOrder = [...orderedCategories];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
        newOrder[currentIndex],
        newOrder[currentIndex - 1],
      ];

      await reorderCategories(newOrder.map((c) => c.id));
    },
    [orderedCategories, reorderCategories]
  );

  const handleMoveDown = useCallback(
    async (categoryId: string) => {
      const currentIndex = orderedCategories.findIndex((c) => c.id === categoryId);
      if (currentIndex < 0 || currentIndex >= orderedCategories.length - 1) return;

      const newOrder = [...orderedCategories];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
        newOrder[currentIndex + 1],
        newOrder[currentIndex],
      ];

      await reorderCategories(newOrder.map((c) => c.id));
    },
    [orderedCategories, reorderCategories]
  );

  const handleMoveActivityToCategory = useCallback(
    async (activityId: string, targetCategoryId: string) => {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      try {
        await updateActivity(activityId, {
          categoryId: targetCategoryId === UNCATEGORIZED_CATEGORY_ID ? null : targetCategoryId,
        });
        resolveMigrationConflict(activityId);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to move activity');
      }
    },
    [activities, updateActivity, resolveMigrationConflict]
  );

  const handleOpenAddActivitiesModal = useCallback((categoryId: string) => {
    setSelectedCategoryForAdd(categoryId);
    setSelectedActivitiesForBulk(new Set());
    setBulkMode(false);
    setAddActivitiesModalVisible(true);
  }, []);

  const handleCloseAddActivitiesModal = useCallback(() => {
    setAddActivitiesModalVisible(false);
    setSelectedCategoryForAdd(null);
    setSelectedActivitiesForBulk(new Set());
    setBulkMode(false);
  }, []);

  const handleToggleActivitySelection = useCallback((activityId: string) => {
    setSelectedActivitiesForBulk((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  }, []);

  const handleAddActivityToCategory = useCallback(
    async (activityId: string) => {
      if (!selectedCategoryForAdd) return;

      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return;

      try {
        await updateActivity(activityId, {
          categoryId: selectedCategoryForAdd === UNCATEGORIZED_CATEGORY_ID ? null : selectedCategoryForAdd,
        });
        resolveMigrationConflict(activityId);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add activity to category');
      }
    },
    [activities, selectedCategoryForAdd, updateActivity, resolveMigrationConflict]
  );

  const handleBulkAddActivitiesToCategory = useCallback(
    async () => {
      if (!selectedCategoryForAdd || selectedActivitiesForBulk.size === 0) return;

      const categoryId = selectedCategoryForAdd === UNCATEGORIZED_CATEGORY_ID ? null : selectedCategoryForAdd;
      const activitiesToUpdate = activities.filter((a) => selectedActivitiesForBulk.has(a.id));

      try {
        // Update all selected activities
        await Promise.all(
          activitiesToUpdate.map((activity) =>
            updateActivity(activity.id, { categoryId })
          )
        );
        if (activityCategoryMigrationConflictActivityIds.length > 0) {
          const next = activityCategoryMigrationConflictActivityIds.filter(
            (id) => !selectedActivitiesForBulk.has(id)
          );
          setActivityCategoryMigrationConflictActivityIds(next);
        }
        Alert.alert('Success', `Added ${activitiesToUpdate.length} activit${activitiesToUpdate.length === 1 ? 'y' : 'ies'} to category`);
        handleCloseAddActivitiesModal();
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add activities to category');
      }
    },
    [selectedCategoryForAdd, selectedActivitiesForBulk, activities, updateActivity, handleCloseAddActivitiesModal, activityCategoryMigrationConflictActivityIds, setActivityCategoryMigrationConflictActivityIds]
  );

  const conflictActivities = useMemo(() => {
    if (!activityCategoryMigrationConflictActivityIds || activityCategoryMigrationConflictActivityIds.length === 0) {
      return [];
    }
    return activities.filter(
      (a) =>
        activityCategoryMigrationConflictActivityIds.includes(a.id) &&
        (a.categoryId === null || a.categoryId === undefined)
    );
  }, [activities, activityCategoryMigrationConflictActivityIds]);

  if (categoriesLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
        <View style={[styles.header, { backgroundColor: theme.background.chrome, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity onPress={handleBack} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Categories</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.button.primary.background} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
      <View style={[styles.header, { backgroundColor: theme.background.chrome, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={handleBack} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Categories</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Migration Status / Needs Review */}
        {conflictActivities.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.background.card, borderColor: theme.input.borderError }]}>
            <Text style={[styles.sectionTitle, { color: theme.input.borderError }]}>Needs Review</Text>
            <Text style={[styles.helperText, { color: theme.text.secondary }]}>
              {conflictActivities.length} activit{conflictActivities.length === 1 ? 'y' : 'ies'} had conflicting legacy categories and need manual assignment.
            </Text>
            {conflictActivities.map((activity) => (
              <View key={activity.id} style={[styles.activityRow, { borderBottomColor: theme.border.secondary }]}>
                <Text style={[styles.activityName, { color: theme.text.primary }]}>{activity.name}</Text>
                <TouchableOpacity
                  style={styles.activityActionButton}
                  onPress={() => {
                    Alert.alert(
                      'Assign Category',
                      `Assign "${activity.name}" to a category:`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        ...orderedCategories
                          .filter((c) => c.id !== UNCATEGORIZED_CATEGORY_ID)
                          .map((c) => ({
                            text: c.name,
                            onPress: () => handleMoveActivityToCategory(activity.id, c.id),
                          })),
                        {
                          text: 'Uncategorized',
                          onPress: () => handleMoveActivityToCategory(activity.id, UNCATEGORIZED_CATEGORY_ID),
                        },
                      ]
                    );
                  }}
                >
                  <MaterialIcons name="drive-file-move" size={20} color={theme.button.primary.background} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Create New Category */}
        <View style={[styles.section, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Create Category</Text>
          <View style={styles.createRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.input.background,
                  borderColor: theme.input.border,
                  color: theme.input.text,
                },
              ]}
              placeholder="Category name"
              placeholderTextColor={theme.input.placeholder}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              onSubmitEditing={handleCreateCategory}
            />
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.button.primary.background }]}
              onPress={handleCreateCategory}
              disabled={creatingCategory || !newCategoryName.trim()}
            >
              {creatingCategory ? (
                <ActivityIndicator size="small" color={theme.button.primary.text} />
              ) : (
                <Text style={[styles.createButtonText, { color: theme.button.primary.text }]}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories List */}
        <View style={[styles.section, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Categories</Text>
          {orderedCategories.map((category, index) => {
            const count = categoryCounts.get(category.id) ?? 0;
            const isEditing = editingCategoryId === category.id;
            const isSystem = category.isSystem ?? false;

            return (
              <View
                key={category.id}
                style={[
                  styles.categoryRow,
                  index !== orderedCategories.length - 1 && { borderBottomColor: theme.border.secondary },
                ]}
              >
                {isEditing ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={[
                        styles.editInput,
                        {
                          backgroundColor: theme.input.background,
                          borderColor: theme.input.border,
                          color: theme.input.text,
                        },
                      ]}
                      value={editingName}
                      onChangeText={setEditingName}
                      autoFocus
                    />
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSaveRename}
                      disabled={!editingName.trim()}
                    >
                      <MaterialIcons name="check" size={20} color={theme.button.primary.background} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRename}>
                      <MaterialIcons name="close" size={20} color={theme.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.categoryHeader}>
                      <TouchableOpacity
                        style={[styles.expandButton, { borderColor: theme.border.secondary }]}
                        onPress={() => toggleCategoryExpanded(category.id)}
                        accessibilityRole="button"
                      >
                        <MaterialIcons
                          name={expandedCategories.has(category.id) ? 'expand-less' : 'expand-more'}
                          size={22}
                          color={theme.text.secondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.categoryInfo}
                        onPress={() => toggleCategoryExpanded(category.id)}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.categoryName, { color: theme.text.primary }]}>{category.name}</Text>
                        <Text style={[styles.categoryCount, { color: theme.text.secondary }]}>
                          {count} activit{count === 1 ? 'y' : 'ies'}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.categoryActions}>
                        <TouchableOpacity
                          style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                          onPress={() => handleMoveUp(category.id)}
                          disabled={index === 0}
                        >
                          <MaterialIcons
                            name="keyboard-arrow-up"
                            size={24}
                            color={index === 0 ? theme.text.tertiary : theme.text.secondary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.moveButton,
                            index === orderedCategories.length - 1 && styles.moveButtonDisabled,
                          ]}
                          onPress={() => handleMoveDown(category.id)}
                          disabled={index === orderedCategories.length - 1}
                        >
                          <MaterialIcons
                            name="keyboard-arrow-down"
                            size={24}
                            color={index === orderedCategories.length - 1 ? theme.text.tertiary : theme.text.secondary}
                          />
                        </TouchableOpacity>
                        {!isSystem && (
                          <>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleStartRename(category.id, category.name)}
                            >
                              <MaterialIcons name="edit" size={20} color={theme.text.secondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleDeleteCategory(category.id, category.name)}
                            >
                              <MaterialIcons name="delete" size={20} color={theme.text.secondary} />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                    {expandedCategories.has(category.id) && (
                      <View style={styles.activitiesList}>
                        {(() => {
                          const categoryActivities = activitiesByCategory.get(category.id) ?? [];
                          return (
                            <>
                              {categoryActivities.length === 0 ? (
                                <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>
                                  No activities in this category
                                </Text>
                              ) : (
                                categoryActivities.map((activity) => (
                                  <View
                                    key={activity.id}
                                    style={[
                                      styles.activityRow,
                                      { borderBottomColor: theme.border.secondary },
                                    ]}
                                  >
                                    <View style={styles.activityInfo}>
                                      <Text style={[styles.activityName, { color: theme.text.primary }]}>
                                        {activity.name}
                                      </Text>
                                      <Text style={[styles.activityUnit, { color: theme.text.secondary }]}>
                                        {activity.unit}
                                      </Text>
                                    </View>
                                    <View style={styles.activityActions}>
                                      <TouchableOpacity
                                        style={styles.activityActionButton}
                                        onPress={() => {
                                          Alert.alert(
                                            'Move Activity',
                                            'Select a category to move this activity to:',
                                            [
                                              { text: 'Cancel', style: 'cancel' },
                                              ...orderedCategories
                                                .filter((c) => c.id !== category.id)
                                                .map((c) => ({
                                                  text: c.name,
                                                  onPress: () => handleMoveActivityToCategory(activity.id, c.id),
                                                })),
                                              {
                                                text: 'Uncategorized',
                                                onPress: () => handleMoveActivityToCategory(activity.id, UNCATEGORIZED_CATEGORY_ID),
                                              },
                                            ]
                                          );
                                        }}
                                      >
                                        <MaterialIcons name="drive-file-move" size={20} color={theme.text.secondary} />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                ))
                              )}
                              <TouchableOpacity
                                style={[styles.addActivityButton, { borderColor: theme.border.secondary }]}
                                onPress={() => handleOpenAddActivitiesModal(category.id)}
                              >
                                <MaterialIcons name="add" size={20} color={theme.button.primary.background} />
                                <Text style={[styles.addActivityButtonText, { color: theme.button.primary.background }]}>
                                  Add Activities
                                </Text>
                              </TouchableOpacity>
                            </>
                          );
                        })()}
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>

        {categoriesError && (
          <View style={[styles.errorContainer, { backgroundColor: theme.background.card }]}>
            <Text style={[styles.errorText, { color: theme.input.borderError }]}>
              {categoriesError.message}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Activities Modal */}
      <Modal
        visible={addActivitiesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseAddActivitiesModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background.screen }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.background.chrome, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
            <TouchableOpacity onPress={handleCloseAddActivitiesModal} style={styles.modalHeaderButton}>
              <MaterialIcons name="close" size={24} color={theme.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              {bulkMode
                ? `Bulk Add Activities${selectedCategoryForAdd ? ` to ${orderedCategories.find((c) => c.id === selectedCategoryForAdd)?.name ?? 'Category'}` : ''}`
                : `Add Activities${selectedCategoryForAdd ? ` to ${orderedCategories.find((c) => c.id === selectedCategoryForAdd)?.name ?? 'Category'}` : ''}`}
            </Text>
            {availableActivitiesForCategory.length > 0 ? (
              <TouchableOpacity
                style={styles.modalHeaderButton}
                onPress={() => {
                  if (bulkMode) {
                    handleBulkAddActivitiesToCategory();
                  } else {
                    setBulkMode(true);
                  }
                }}
                disabled={bulkMode && selectedActivitiesForBulk.size === 0}
              >
                {bulkMode ? (
                  <Text
                    style={[
                      styles.modalActionText,
                      {
                        color:
                          selectedActivitiesForBulk.size === 0
                            ? theme.text.tertiary
                            : theme.button.primary.background,
                      },
                    ]}
                  >
                    Add ({selectedActivitiesForBulk.size})
                  </Text>
                ) : (
                  <Text style={[styles.modalActionText, { color: theme.button.primary.background }]}>
                    Bulk
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.modalHeaderButton} />
            )}
          </View>

          {availableActivitiesForCategory.length === 0 ? (
            <View style={styles.modalEmptyContainer}>
              <Text style={[styles.modalEmptyText, { color: theme.text.secondary }]}>
                No activities available to add
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableActivitiesForCategory}
              keyExtractor={(item) => item.id}
              renderItem={({ item: activity }) => {
                const isSelected = selectedActivitiesForBulk.has(activity.id);

                if (bulkMode) {
                  return (
                    <TouchableOpacity
                      style={[
                        styles.modalActivityRow,
                        { backgroundColor: theme.background.surface, borderBottomColor: theme.border.secondary },
                        isSelected && { backgroundColor: theme.button.primary.background + '20' },
                      ]}
                      onPress={() => handleToggleActivitySelection(activity.id)}
                    >
                      <View style={styles.modalActivityInfo}>
                        <Text style={[styles.modalActivityName, { color: theme.text.primary }]}>
                          {activity.name}
                        </Text>
                        <Text style={[styles.modalActivityUnit, { color: theme.text.secondary }]}>
                          {activity.unit}
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={24} color={theme.button.primary.background} />
                      )}
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      style={[
                        styles.modalActivityRow,
                        { backgroundColor: theme.background.surface, borderBottomColor: theme.border.secondary },
                      ]}
                      onPress={() => handleAddActivityToCategory(activity.id)}
                    >
                      <View style={styles.modalActivityInfo}>
                        <Text style={[styles.modalActivityName, { color: theme.text.primary }]}>
                          {activity.name}
                        </Text>
                        <Text style={[styles.modalActivityUnit, { color: theme.text.secondary }]}>
                          {activity.unit}
                        </Text>
                      </View>
                      <MaterialIcons name="add" size={24} color={theme.button.primary.background} />
                    </TouchableOpacity>
                  );
                }
              }}
              contentContainerStyle={styles.modalContentContainer}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  createRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryRow: {
    borderBottomWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activitiesList: {
    paddingLeft: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityUnit: {
    fontSize: 13,
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityActionButton: {
    padding: 4,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addActivityButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalHeaderButton: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContentContainer: {
    padding: 16,
  },
  modalActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalActivityInfo: {
    flex: 1,
  },
  modalActivityName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  modalActivityUnit: {
    fontSize: 14,
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalEmptyText: {
    fontSize: 16,
  },
  moveButton: {
    padding: 4,
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  actionButton: {
    padding: 4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  editInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  saveButton: {
    padding: 4,
  },
  cancelButton: {
    padding: 4,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
  },
});
