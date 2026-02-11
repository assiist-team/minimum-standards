import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity } from '@minimum-standards/shared-model';
import { StepHeader } from '../../navigation/CreateStandardFlow';
import { CreateStandardFlowParamList, MainStackParamList } from '../../navigation/types';
import { useActivities } from '../../hooks/useActivities';
import { useCategories } from '../../hooks/useCategories';
import { useStandardsBuilderStore } from '../../stores/standardsBuilderStore';
import { useTheme } from '../../theme/useTheme';
import { ActivityModal } from '../../components/ActivityModal';

type FlowNav = NativeStackNavigationProp<CreateStandardFlowParamList>;
type MainNav = NativeStackNavigationProp<MainStackParamList>;

export function SelectActivityStep() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const flowNavigation = useNavigation<FlowNav>();
  const mainNavigation = useNavigation<MainNav>();

  const { activities, createActivity, updateActivity, searchQuery, setSearchQuery } =
    useActivities();
  const { orderedCategories } = useCategories();

  const selectedActivity = useStandardsBuilderStore((s) => s.selectedActivity);
  const setSelectedActivity = useStandardsBuilderStore((s) => s.setSelectedActivity);

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [learnMoreExpanded, setLearnMoreExpanded] = useState(false);

  const handleClose = useCallback(() => {
    mainNavigation.goBack();
  }, [mainNavigation]);

  const handleNext = useCallback(() => {
    if (selectedActivity) {
      flowNavigation.navigate('SetVolume');
    }
  }, [selectedActivity, flowNavigation]);

  const handleSelectActivity = useCallback(
    (activity: Activity) => {
      setSelectedActivity(activity);
    },
    [setSelectedActivity],
  );

  const handleCreateActivitySave = useCallback(
    async (
      activityData: Omit<Activity, 'id' | 'createdAtMs' | 'updatedAtMs' | 'deletedAtMs'>,
    ) => {
      const created = await createActivity(activityData);
      return created;
    },
    [createActivity],
  );

  const handleCreatedActivitySelect = useCallback(
    (activity: Activity) => {
      setSelectedActivity(activity);
    },
    [setSelectedActivity],
  );

  const handleCategoryChange = useCallback(
    async (categoryId: string | null) => {
      if (!selectedActivity) return;
      await updateActivity(selectedActivity.id, { categoryId });
      // Update the local selectedActivity reference to reflect the change
      setSelectedActivity({ ...selectedActivity, categoryId });
      setShowCategoryPicker(false);
    },
    [selectedActivity, updateActivity, setSelectedActivity],
  );

  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return 'None';
    const category = orderedCategories.find((c) => c.id === categoryId);
    return category?.name ?? 'None';
  };

  const renderActivityRow = ({ item }: { item: Activity }) => {
    const isSelected = selectedActivity?.id === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.activityRow,
          {
            backgroundColor: isSelected
              ? theme.background.surface
              : theme.background.chrome,
            borderBottomColor: theme.border.primary,
          },
        ]}
        onPress={() => handleSelectActivity(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.activityName, { color: theme.text.primary }]}>{item.name}</Text>
        <MaterialIcons
          name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
          size={22}
          color={isSelected ? theme.button.primary.background : theme.text.secondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.chrome }]}>
      <StepHeader
        step={0}
        totalSteps={3}
        title="Select Activity"
        onClose={handleClose}
      />

      {/* T022: Inline Tip */}
      <View
        style={[
          styles.tipContainer,
          {
            backgroundColor: theme.background.surface,
            borderLeftColor: theme.button.primary.background,
          },
        ]}
      >
        <View style={styles.tipRow}>
          <MaterialIcons
            name="lightbulb-outline"
            size={16}
            color={theme.text.secondary}
            style={styles.tipIcon}
          />
          <Text style={[styles.tipText, { color: theme.text.secondary }]}>
            Pick the activity that, if you did enough of it, would make success almost
            guaranteed.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setLearnMoreExpanded(!learnMoreExpanded)}
          style={styles.learnMoreButton}
        >
          <Text style={[styles.learnMoreText, { color: theme.button.primary.background }]}>
            {learnMoreExpanded ? 'Show Less' : 'Learn More'}
          </Text>
          <MaterialIcons
            name={learnMoreExpanded ? 'expand-less' : 'expand-more'}
            size={16}
            color={theme.button.primary.background}
          />
        </TouchableOpacity>
        {learnMoreExpanded && (
          <Text style={[styles.learnMoreContent, { color: theme.text.secondary }]}>
            A Minimum Standard is the smallest amount of an activity you can commit to doing
            consistently. The key insight: choose the activity that is most directly connected to
            your goal. If your goal is to get fit, what single activity, done consistently, would
            make that almost inevitable? Focus on the "lead domino" — the one action that makes
            everything else easier or unnecessary.
          </Text>
        )}
      </View>

      {/* T019: Search input */}
      <View style={[styles.searchContainer, { borderBottomColor: theme.border.primary }]}>
        <MaterialIcons
          name="search"
          size={20}
          color={theme.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.input.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search activities..."
          placeholderTextColor={theme.input.placeholder}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={18} color={theme.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* T019: Activity List */}
      <FlatList
        data={activities}
        renderItem={renderActivityRow}
        keyExtractor={(item) => item.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.createNewRow, { borderBottomColor: theme.border.primary }]}
            onPress={() => setShowActivityModal(true)}
          >
            <MaterialIcons name="add" size={22} color={theme.button.primary.background} />
            <Text
              style={[styles.createNewText, { color: theme.button.primary.background }]}
            >
              Create New Activity
            </Text>
          </TouchableOpacity>
        }
      />

      {/* T020 & T021: Selected Activity Details */}
      {selectedActivity && (
        <View style={[styles.selectionDetails, { borderTopColor: theme.border.primary }]}>
          <Text style={[styles.selectionLabel, { color: theme.text.primary }]}>
            {selectedActivity.name}
          </Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailText, { color: theme.text.secondary }]}>
              Unit: {selectedActivity.unit || '(none)'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={[styles.detailText, { color: theme.text.secondary }]}>
              Category: {getCategoryName(selectedActivity.categoryId)}
            </Text>
            <MaterialIcons name="edit" size={14} color={theme.text.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* T021: Category Picker Overlay */}
      {showCategoryPicker && selectedActivity && (
        <View
          style={[
            styles.categoryPickerOverlay,
            { backgroundColor: theme.background.overlay },
          ]}
        >
          <View
            style={[
              styles.categoryPickerContent,
              {
                backgroundColor: theme.background.chrome,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View
              style={[styles.categoryPickerHeader, { borderBottomColor: theme.border.primary }]}
            >
              <Text style={[styles.categoryPickerTitle, { color: theme.text.primary }]}>
                Assign Category
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <MaterialIcons name="close" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.categoryOption, { borderBottomColor: theme.border.primary }]}
              onPress={() => handleCategoryChange(null)}
            >
              <Text style={[styles.categoryOptionText, { color: theme.text.primary }]}>
                None
              </Text>
              {!selectedActivity.categoryId && (
                <MaterialIcons name="check" size={20} color={theme.button.primary.background} />
              )}
            </TouchableOpacity>
            {orderedCategories
              .filter((c) => !c.isSystem)
              .map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryOption, { borderBottomColor: theme.border.primary }]}
                  onPress={() => handleCategoryChange(category.id)}
                >
                  <Text style={[styles.categoryOptionText, { color: theme.text.primary }]}>
                    {category.name}
                  </Text>
                  {selectedActivity.categoryId === category.id && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={theme.button.primary.background}
                    />
                  )}
                </TouchableOpacity>
              ))}
          </View>
        </View>
      )}

      {/* Next Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.background.chrome,
            borderTopColor: theme.border.primary,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: selectedActivity
                ? theme.button.primary.background
                : theme.button.disabled.background,
            },
          ]}
          onPress={handleNext}
          disabled={!selectedActivity}
        >
          <Text
            style={[
              styles.nextButtonText,
              {
                color: selectedActivity
                  ? theme.button.primary.text
                  : theme.button.disabled.text,
              },
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* Activity Modal for creating new activities */}
      <ActivityModal
        visible={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onSave={handleCreateActivitySave}
        onSelect={handleCreatedActivitySelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Tip styles (T022)
  tipContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 24,
  },
  learnMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  learnMoreContent: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    paddingLeft: 24,
  },
  // Search styles (T019)
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  // Activity list styles (T019)
  list: {
    flex: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  activityName: {
    fontSize: 16,
    flex: 1,
  },
  createNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Selection detail styles (T020)
  selectionDetails: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  selectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
  },
  // Category picker styles (T021)
  categoryPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  categoryPickerContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
  },
  categoryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  categoryPickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryOptionText: {
    fontSize: 16,
  },
  // Footer styles
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
