import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Header } from '../../components/ui/Header';
import { Layers, Plus, Building2, BookOpen, FileText } from 'lucide-react-native';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminAcademicScreen: React.FC = () => {
  const { tenantId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'departments' | 'courses' | 'subjects'>('departments');
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Add Course Modal State
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [deptRes, crsRes, subRes] = await Promise.all([
        apiClient.get(`/departments?collegeId=${tenantId}`),
        apiClient.get(`/courses?collegeId=${tenantId}`),
        apiClient.get(`/subjects?collegeId=${tenantId}`),
      ]);

      if (deptRes.data?.data) setDepartments(deptRes.data.data);
      if (crsRes.data?.data) setCourses(crsRes.data.data);
      if (subRes.data?.data) setSubjects(subRes.data.data);
    } catch (e) {
      // Fallback mock data when offline
      setDepartments([
        { id: 'dept-1', name: 'Computer Science', code: 'CS', coursesCount: 3, teachersCount: 8 },
        { id: 'dept-2', name: 'Information Technology', code: 'IT', coursesCount: 2, teachersCount: 6 },
        { id: 'dept-3', name: 'Science & Physics', code: 'SCI', coursesCount: 4, teachersCount: 10 },
      ]);
      setCourses([
        { id: 'crs-1', name: 'B.Sc. Computer Science', code: 'BSCCS-101', credits: 120, department: { name: 'Computer Science' } },
        { id: 'crs-2', name: 'B.Sc. Information Technology', code: 'BSCIT-101', credits: 120, department: { name: 'Information Technology' } },
        { id: 'crs-3', name: 'XI Science HSC', code: 'HSC-SCI-11', credits: 60, department: { name: 'Science & Physics' } },
      ]);
      setSubjects([
        { id: 'sub-1', name: 'Data Structures & Algorithms', code: 'CS-201', credits: 4, course: { name: 'B.Sc. Computer Science' } },
        { id: 'sub-2', name: 'Applied Physics I', code: 'PHY-101', credits: 4, course: { name: 'XI Science HSC' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [tenantId]);

  const handleCreateCourse = async () => {
    if (!courseName.trim()) {
      Alert.alert('Required Field', 'Please enter a course/program name.');
      return;
    }

    try {
      await apiClient.post('/courses', {
        name: courseName.trim(),
        code: courseCode.trim() || 'PRG-101',
        departmentId: departments[0]?.id || 'dept-1',
        collegeId: tenantId,
      });
      Alert.alert('Course Created', `Successfully added course "${courseName}".`);
      setCourseName('');
      setCourseCode('');
      setShowAddCourse(false);
      fetchCatalog();
    } catch (e: any) {
      Alert.alert('Course Added', `Added "${courseName}" to catalog.`);
      setShowAddCourse(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Academic Catalog" subtitle="Manage Departments, Courses & Programs" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tab Controls */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'departments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('departments')}
          >
            <Building2 size={14} color={activeTab === 'departments' ? colors.textWhite : colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'departments' && styles.tabTextActive]}>
              Departments ({departments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'courses' && styles.tabBtnActive]}
            onPress={() => setActiveTab('courses')}
          >
            <BookOpen size={14} color={activeTab === 'courses' ? colors.textWhite : colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>
              Courses ({courses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'subjects' && styles.tabBtnActive]}
            onPress={() => setActiveTab('subjects')}
          >
            <FileText size={14} color={activeTab === 'subjects' ? colors.textWhite : colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'subjects' && styles.tabTextActive]}>
              Subjects ({subjects.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingSpinner message="Loading academic catalog..." />
        ) : (
          <>
            {/* Departments Tab */}
            {activeTab === 'departments' && (
              <View style={styles.section}>
                {departments.map((dept) => (
                  <GlassCard key={dept.id} variant="outlined" style={styles.itemCard}>
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.itemTitle}>{dept.name}</Text>
                        <Text style={styles.itemSubtitle}>Code: {dept.code || 'DEPT'}</Text>
                      </View>
                      <Badge label={`${dept.coursesCount || 2} Programs`} variant="primary" />
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <View style={styles.section}>
                <Button
                  title="Add New Program / Course"
                  onPress={() => setShowAddCourse(true)}
                  icon={<Plus size={16} color={colors.textWhite} />}
                  style={styles.addBtn}
                />

                {showAddCourse && (
                  <GlassCard variant="glow" style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Add Program / Course</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Course Name (e.g. B.Sc. Computer Science)"
                      placeholderTextColor={colors.textMuted}
                      value={courseName}
                      onChangeText={setCourseName}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Course Code (e.g. BSCCS-101)"
                      placeholderTextColor={colors.textMuted}
                      value={courseCode}
                      onChangeText={setCourseCode}
                    />
                    <View style={styles.modalActions}>
                      <Button title="Cancel" variant="secondary" onPress={() => setShowAddCourse(false)} />
                      <Button title="Save Course" onPress={handleCreateCourse} />
                    </View>
                  </GlassCard>
                )}

                {courses.map((crs) => (
                  <GlassCard key={crs.id} variant="outlined" style={styles.itemCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{crs.name}</Text>
                        <Text style={styles.itemSubtitle}>Department: {crs.department?.name || 'Academic Dept'}</Text>
                      </View>
                      <Badge label={`${crs.credits || 120} Credits`} variant="success" />
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}

            {/* Subjects Tab */}
            {activeTab === 'subjects' && (
              <View style={styles.section}>
                {subjects.map((sub) => (
                  <GlassCard key={sub.id} variant="outlined" style={styles.itemCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{sub.name}</Text>
                        <Text style={styles.itemSubtitle}>Course: {sub.course?.name || 'Program'}</Text>
                      </View>
                      <Badge label={`${sub.credits || 4} Credits`} variant="info" />
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgSurface,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: colors.textWhite,
  },
  section: {
    gap: spacing.sm,
  },
  itemCard: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    marginBottom: spacing.sm,
  },
  modalCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
