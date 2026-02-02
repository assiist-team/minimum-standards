import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SETTINGS_STACK_ROOT_SCREEN_NAME, type SettingsStackParamList } from '../navigation/types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useActivities } from '../hooks/useActivities';
import { useCategories } from '../hooks/useCategories';
import { useTheme } from '../theme/useTheme';
import { UNCATEGORIZED_CATEGORY_ID, Activity, activitySchema } from '@minimum-standards/shared-model';

export function ActivitySettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const route = useRoute<RouteProp<SettingsStackParamList, 'Activities'>>();
  const {
    allActivities,
    loading: activitiesLoading,
    error: activitiesError,
    updateActivity,
    deleteActivity,
  } = useActivities();
  const { orderedCategories } = useCategories();

  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingUnit, setEditingUnit] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Create category name map
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    orderedCategories.forEach((cat) => {
      map.set(cat.id, cat.name);
    });
    map.set(UNCATEGORIZED_CATEGORY_ID, 'Uncategorized');
    return map;
  }, [orderedCategories]);

  // Filter activities by search query
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) {
      return allActivities;
    }
    const query = searchQuery.toLowerCase();
    return allActivities.filter((activity) =>
      activity.name.toLowerCase().includes(query) ||
      activity.unit.toLowerCase().includes(query)
    );
  }, [allActivities, searchQuery]);

  const handleBack = useCallback(() => {
    if (route.params?.backTo === 'Dashboard') {
      navigation.reset({
        index: 0,
        routes: [{ name: SETTINGS_STACK_ROOT_SCREEN_NAME }],
      });
      navigation.getParent()?.navigate('Dashboard' as never);
      return;
    }
    navigation.goBack();
  }, [navigation, route.params?.backTo]);

  const handleStartEdit = useCallback((activity: Activity) => {
    setEditingActivityId(activity.id);
    setEditingName(activity.name);
    setEditingUnit(activity.unit);
    setEditingNotes(activity.notes ?? '');
    setEditingCategoryId(activity.categoryId ?? UNCATEGORIZED_CATEGORY_ID);
    setEditModalVisible(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingActivityId(null);
    setEditingName('');
    setEditingUnit('');
    setEditingNotes('');
    setEditingCategoryId(null);
    setEditModalVisible(false);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingActivityId) return;

    const trimmedName = editingName.trim();
    const trimmedUnit = editingUnit.trim();

    if (!trimmedName) {
      Alert.alert('Error', 'Activity name cannot be empty.');
      return;
    }
    if (trimmedName.length > 120) {
      Alert.alert('Error', 'Activity name must be 120 characters or fewer.');
      return;
    }
    if (!trimmedUnit) {
      Alert.alert('Error', 'Unit cannot be empty.');
      return;
    }
    if (trimmedUnit.length > 40) {
      Alert.alert('Error', 'Unit must be 40 characters or fewer.');
      return;
    }
    if (editingNotes.length > 1000) {
      Alert.alert('Error', 'Notes cannot exceed 1000 characters.');
      return;
    }

    try {
      // Parse through schema to normalize unit
      const activityData = activitySchema.parse({
        id: editingActivityId,
        name: trimmedName,
        unit: trimmedUnit,
        notes: editingNotes.trim() || null,
        categoryId: editingCategoryId === UNCATEGORIZED_CATEGORY_ID ? null : editingCategoryId,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
        deletedAtMs: null,
      });

      await updateActivity(editingActivityId, {
        name: activityData.name,
        unit: activityData.unit,
        notes: activityData.notes,
        categoryId: activityData.categoryId ?? null,
      });

      handleCancelEdit();
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to update activity');
      }
    }
  }, [editingActivityId, editingName, editingUnit, editingNotes, editingCategoryId, updateActivity, handleCancelEdit]);

  const handleDeleteActivity = useCallback(
    async (activity: Activity) => {
      Alert.alert(
        'Delete Activity',
        `Delete "${activity.name}"?\n\nThis will also remove any standards for this activity from your Standards Library.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteActivity(activity.id);
              } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete activity');
              }
            },
          },
        ]
      );
    },
    [deleteActivity]
  );

  const handleChangeCategory = useCallback(() => {
    if (!editingCategoryId) return;

    Alert.alert(
      'Change Category',
      'Select a category:',
      [
        { text: 'Cancel', style: 'cancel' },
        ...orderedCategories
          .filter((c) => c.id !== editingCategoryId)
          .map((c) => ({
            text: c.name,
            onPress: () => setEditingCategoryId(c.id),
          })),
        {
          text: 'Uncategorized',
          onPress: () => setEditingCategoryId(UNCATEGORIZED_CATEGORY_ID),
          style: editingCategoryId === UNCATEGORIZED_CATEGORY_ID ? 'cancel' : undefined,
        },
      ]
    );
  }, [editingCategoryId, orderedCategories]);

  if (activitiesLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
        <View style={[styles.header, { backgroundColor: theme.background.chrome, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity onPress={handleBack} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Activities</Text>
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
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Activities</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
          <MaterialIcons name="search" size={20} color={theme.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text.primary }]}
            placeholder="Search activities..."
            placeholderTextColor={theme.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <MaterialIcons name="close" size={20} color={theme.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Activities List */}
        <View style={[styles.section, { backgroundColor: theme.background.surface, borderColor: theme.border.secondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>
            Activities ({filteredActivities.length})
          </Text>
          {filteredActivities.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>
              {searchQuery ? 'No activities found' : 'No activities yet'}
            </Text>
          ) : (
            filteredActivities.map((activity, index) => {
              const categoryName = categoryNameMap.get(
                activity.categoryId ?? UNCATEGORIZED_CATEGORY_ID
              ) ?? 'Uncategorized';

              return (
                <View
                  key={activity.id}
                  style={[
                    styles.activityRow,
                    {
                      borderBottomColor: theme.border.secondary,
                      borderBottomWidth: index !== filteredActivities.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityName, { color: theme.text.primary }]}>
                      {activity.name}
                    </Text>
                    <View style={styles.activityMeta}>
                      <Text style={[styles.activityUnit, { color: theme.text.secondary }]}>
                        {activity.unit}
                      </Text>
                      {categoryName !== 'Uncategorized' && (
                        <>
                          <Text style={[styles.metaSeparator, { color: theme.text.tertiary }]}>•</Text>
                          <Text style={[styles.activityCategory, { color: theme.text.secondary }]}>
                            {categoryName}
                          </Text>
                        </>
                      )}
                    </View>
                    {activity.notes && (
                      <Text style={[styles.activityNotes, { color: theme.text.tertiary }]} numberOfLines={1}>
                        {activity.notes}
                      </Text>
                    )}
                  </View>
                  <View style={styles.activityActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleStartEdit(activity)}
                    >
                      <MaterialIcons name="edit" size={20} color={theme.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteActivity(activity)}
                    >
                      <MaterialIcons name="delete" size={20} color={theme.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {activitiesError && (
          <View style={[styles.errorContainer, { backgroundColor: theme.background.card }]}>
            <Text style={[styles.errorText, { color: theme.input.borderError }]}>
              {activitiesError.message}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background.screen }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.background.chrome, borderBottomColor: theme.border.secondary, paddingTop: Math.max(insets.top, 12) }]}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.modalHeaderButton}>
              <MaterialIcons name="close" size={24} color={theme.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Edit Activity</Text>
            <TouchableOpacity
              style={styles.modalHeaderButton}
              onPress={handleSaveEdit}
            >
              <Text style={[styles.modalActionText, { color: theme.button.primary.background }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: theme.text.secondary }]}>Name</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                placeholder="Activity name"
                placeholderTextColor={theme.input.placeholder}
                value={editingName}
                onChangeText={setEditingName}
                maxLength={120}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: theme.text.secondary }]}>Unit</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                placeholder="Unit (e.g., miles, hours)"
                placeholderTextColor={theme.input.placeholder}
                value={editingUnit}
                onChangeText={setEditingUnit}
                autoCorrect={false}
                maxLength={40}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: theme.text.secondary }]}>Category</Text>
              <TouchableOpacity
                style={[
                  styles.modalCategoryButton,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                  },
                ]}
                onPress={handleChangeCategory}
              >
                <Text style={[styles.modalCategoryText, { color: theme.text.primary }]}>
                  {categoryNameMap.get(editingCategoryId ?? UNCATEGORIZED_CATEGORY_ID) ?? 'Uncategorized'}
                </Text>
                <MaterialIcons name="chevron-right" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: theme.text.secondary }]}>Notes (Optional)</Text>
              <TextInput
                style={[
                  styles.modalTextArea,
                  {
                    backgroundColor: theme.input.background,
                    borderColor: theme.input.border,
                    color: theme.input.text,
                  },
                ]}
                placeholder="Add notes..."
                placeholderTextColor={theme.input.placeholder}
                value={editingNotes}
                onChangeText={setEditingNotes}
                multiline
                numberOfLines={4}
                maxLength={1000}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
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
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityUnit: {
    fontSize: 14,
  },
  metaSeparator: {
    fontSize: 14,
  },
  activityCategory: {
    fontSize: 14,
  },
  activityNotes: {
    fontSize: 13,
    marginTop: 4,
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },
  errorContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
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
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  modalCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCategoryText: {
    fontSize: 16,
  },
  modalTextArea: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
  },
});
