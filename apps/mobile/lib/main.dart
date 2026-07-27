import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'utils/college_utils.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint("Warning: Could not load .env file, using default environments.");
  }
  runApp(const CampusConnectApp());
}

class CampusConnectApp extends StatefulWidget {
  const CampusConnectApp({Key? key}) : super(key: key);

  @override
  State<CampusConnectApp> createState() => _CampusConnectAppState();
}

class _CampusConnectAppState extends State<CampusConnectApp> {
  ThemeMode _themeMode = ThemeMode.dark;

  void toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Campus Connect',
      debugShowCheckedModeBanner: false,
      themeMode: _themeMode,
      // Classic Premium Light Theme
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        primaryColor: const Color(0xFF4F46E5),
        cardColor: Colors.white,
        dividerColor: const Color(0xFFE2E8F0),
        fontFamily: 'Inter',
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF4F46E5),
          secondary: Color(0xFF0EA5E9),
          background: Color(0xFFF8FAFC),
          surface: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          iconTheme: IconThemeData(color: Color(0xFF0F172A)),
          titleTextStyle: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.bold,
            fontSize: 18,
            fontFamily: 'Outfit',
          ),
        ),
      ),
      // Classic Premium Dark Theme (Linear + Vercel inspired)
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF020817),
        primaryColor: const Color(0xFF6366F1),
        cardColor: const Color(0xFF0F172A),
        dividerColor: const Color(0xFF1E293B),
        fontFamily: 'Inter',
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF6366F1),
          secondary: Color(0xFF38BDF8),
          background: Color(0xFF020817),
          surface: Color(0xFF0F172A),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF020817),
          elevation: 0,
          scrolledUnderElevation: 0,
          iconTheme: IconThemeData(color: Color(0xFFF8FAFC)),
          titleTextStyle: TextStyle(
            color: Color(0xFFF8FAFC),
            fontWeight: FontWeight.bold,
            fontSize: 18,
            fontFamily: 'Outfit',
          ),
        ),
      ),
      home: LoginScreen(toggleTheme: toggleTheme),
    );
  }
}

// -----------------------------------------------------------------------------
// UNIVERSAL SINGLE LOGIN SCREEN
// -----------------------------------------------------------------------------
class LoginScreen extends StatefulWidget {
  final VoidCallback toggleTheme;
  const LoginScreen({Key? key, required this.toggleTheme}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _secureStorage = const FlutterSecureStorage();
  final _identifierController = TextEditingController(text: 'student@campusconnect.edu');
  final _passwordController = TextEditingController(text: 'password123');

  String _selectedTenant = 'college-a';
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text;

    if (identifier.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter identifier and password.')),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 600)); // Smooth transitions

    String role = 'STUDENT';
    String name = 'Anish Patil';
    String prnOrEmp = '2026CS101';

    final lower = identifier.toLowerCase();
    if (lower.contains('teacher') || lower.contains('prof') || lower.contains('emp')) {
      role = 'TEACHER';
      name = 'Prof. Anish Patil';
      prnOrEmp = 'EMP-T802';
    } else if (lower.contains('admin') || lower.contains('sys')) {
      role = 'ADMIN';
      name = 'System Administrator';
      prnOrEmp = 'ADM-001';
    }

    await _secureStorage.write(key: 'jwt_token', value: 'demo_jwt_token_2026');
    await _secureStorage.write(key: 'user_role', value: role);
    await _secureStorage.write(key: 'user_name', value: name);
    await _secureStorage.write(key: 'tenant_id', value: _selectedTenant);

    setState(() => _isLoading = false);

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => MainWorkspaceShell(
            role: role,
            name: name,
            prnOrEmp: prnOrEmp,
            tenantId: _selectedTenant,
            toggleTheme: widget.toggleTheme,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.school, size: 18, color: Colors.white),
            ),
            const SizedBox(width: 10),
            const Text('Campus Connect'),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: widget.toggleTheme,
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero Heading
              Text(
                'Universal Portal Gateway',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Enter Email, PRN, or Employee ID for single sign-on.',
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 28),

              // Institution Selector (Tenant Selector)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'INSTITUTION TENANT',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ChoiceChip(
                            label: const Text('Pushpalata College', style: TextStyle(fontSize: 12)),
                            selected: _selectedTenant == 'college-a',
                            selectedColor: Theme.of(context).primaryColor,
                            onSelected: (val) {
                              if (val) setState(() => _selectedTenant = 'college-a');
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ChoiceChip(
                            label: const Text('Balasaheb College', style: TextStyle(fontSize: 12)),
                            selected: _selectedTenant == 'college-b',
                            selectedColor: Theme.of(context).primaryColor,
                            onSelected: (val) {
                              if (val) setState(() => _selectedTenant = 'college-b');
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Login Form Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'IDENTIFIER (EMAIL / PRN / EMP ID)',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _identifierController,
                      style: const TextStyle(fontSize: 14),
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.person_outline, size: 20),
                        hintText: 'student@campus.edu or PRN2026001',
                        filled: true,
                        fillColor: isDark ? const Color(0xFF020817) : const Color(0xFFF1F5F9),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Theme.of(context).dividerColor),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Theme.of(context).dividerColor),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    Text(
                      'PASSWORD',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      style: const TextStyle(fontSize: 14),
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.lock_outline, size: 20),
                        hintText: '••••••••',
                        filled: true,
                        fillColor: isDark ? const Color(0xFF020817) : const Color(0xFFF1F5F9),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Theme.of(context).dividerColor),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Theme.of(context).dividerColor),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).primaryColor,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text(
                                'Sign In to Workspace',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// MAIN WORKSPACE SHELL (ROLE-BASED TABS)
// -----------------------------------------------------------------------------
class MainWorkspaceShell extends StatefulWidget {
  final String role;
  final String name;
  final String prnOrEmp;
  final String tenantId;
  final VoidCallback toggleTheme;

  const MainWorkspaceShell({
    Key? key,
    required this.role,
    required this.name,
    required this.prnOrEmp,
    required this.tenantId,
    required this.toggleTheme,
  }) : super(key: key);

  @override
  State<MainWorkspaceShell> createState() => _MainWorkspaceShellState();
}

class _MainWorkspaceShellState extends State<MainWorkspaceShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    List<Widget> pages = [];
    List<BottomNavigationBarItem> items = [];

    if (widget.role == 'ADMIN') {
      pages = [
        AdminOverviewTab(name: widget.name, tenantId: widget.tenantId),
        AdminTimetableTab(tenantId: widget.tenantId),
        AdminAnnouncementsTab(),
        ProfileTab(name: widget.name, role: widget.role, idVal: widget.prnOrEmp, tenantId: widget.tenantId, toggleTheme: widget.toggleTheme),
      ];
      items = const [
        BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Dashboard'),
        BottomNavigationBarItem(icon: Icon(Icons.calendar_month_rounded), label: 'Timetable'),
        BottomNavigationBarItem(icon: Icon(Icons.campaign_rounded), label: 'Announce'),
        BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profile'),
      ];
    } else if (widget.role == 'TEACHER') {
      pages = [
        TeacherOverviewTab(name: widget.name, empId: widget.prnOrEmp),
        TeacherAttendanceTab(),
        TeacherNotesTab(),
        TeacherStudentsTab(),
        ProfileTab(name: widget.name, role: widget.role, idVal: widget.prnOrEmp, tenantId: widget.tenantId, toggleTheme: widget.toggleTheme),
      ];
      items = const [
        BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.fact_check_rounded), label: 'Attendance'),
        BottomNavigationBarItem(icon: Icon(Icons.upload_file_rounded), label: 'Notes'),
        BottomNavigationBarItem(icon: Icon(Icons.groups_rounded), label: 'Students'),
        BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profile'),
      ];
    } else {
      // STUDENT
      pages = [
        StudentOverviewTab(name: widget.name, prn: widget.prnOrEmp, tenantId: widget.tenantId),
        StudentAttendanceTab(),
        StudentTimetableTab(),
        StudentNotesResultsTab(),
        ProfileTab(name: widget.name, role: widget.role, idVal: widget.prnOrEmp, tenantId: widget.tenantId, toggleTheme: widget.toggleTheme),
      ];
      items = const [
        BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Overview'),
        BottomNavigationBarItem(icon: Icon(Icons.pie_chart_outline_rounded), label: 'Attendance'),
        BottomNavigationBarItem(icon: Icon(Icons.calendar_month_rounded), label: 'Timetable'),
        BottomNavigationBarItem(icon: Icon(Icons.library_books_rounded), label: 'Resources'),
        BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profile'),
      ];
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(getCollegeName(widget.tenantId), style: const TextStyle(fontSize: 11, color: Colors.grey)),
            Text('${widget.role} Portal', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: widget.toggleTheme,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => LoginScreen(toggleTheme: widget.toggleTheme)),
              );
            },
          ),
        ],
      ),
      body: pages[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Theme.of(context).cardColor,
          selectedItemColor: Theme.of(context).primaryColor,
          unselectedItemColor: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
          selectedFontSize: 11,
          unselectedFontSize: 11,
          items: items,
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// STUDENT TABS
// -----------------------------------------------------------------------------
class StudentOverviewTab extends StatelessWidget {
  final String name;
  final String prn;
  final String tenantId;

  const StudentOverviewTab({Key? key, required this.name, required this.prn, required this.tenantId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Greeting Banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: Theme.of(context).primaryColor.withOpacity(0.2),
                  child: Text(name[0], style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Theme.of(context).primaryColor)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Welcome back, $name 👋', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 2),
                      Text('PRN: $prn • Computer Engineering', style: TextStyle(fontSize: 12, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B))),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Stat Cards Grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.6,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            children: [
              _buildStatCard(context, 'Attendance', '88.5%', 'Overall Present', Icons.pie_chart_rounded, const Color(0xFF10B981)),
              _buildStatCard(context, 'Semester GPA', '9.15', 'CGPA: 8.94', Icons.auto_graph_rounded, const Color(0xFF6366F1)),
              _buildStatCard(context, 'Assignments', '2 Pending', '1 Submitted Today', Icons.assignment_rounded, const Color(0xFFF59E0B)),
              _buildStatCard(context, 'Fee Status', 'Paid', 'Academic Year 2026', Icons.verified_rounded, const Color(0xFF0EA5E9)),
            ],
          ),
          const SizedBox(height: 20),

          // Today's Lectures
          const Text('Today\'s Lectures', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 10),
          _buildLectureItem(context, 'Advanced Web Architecture', '09:00 AM - 10:30 AM', 'Lab 3', 'Prof. Anish Patil', true),
          const SizedBox(height: 8),
          _buildLectureItem(context, 'Database Systems & Prisma', '11:00 AM - 12:30 PM', 'Hall B', 'Dr. S. Sharma', false),
          const SizedBox(height: 20),

          // Announcements
          const Text('Recent Announcements', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 10),
          _buildAnnouncementCard(context, 'Mid-Semester Examination Schedule', 'The mid-sem exam dates for Semester VI have been published.', '2 hours ago'),
        ],
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, String sub, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
              Icon(icon, size: 18, color: color),
            ],
          ),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text(sub, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildLectureItem(BuildContext context, String title, String time, String room, String teacher, bool isLive) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (isLive ? Colors.green : Colors.indigo).withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.schedule_rounded, color: isLive ? Colors.green : Colors.indigo, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text('$time • Room: $room • $teacher', style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnnouncementCard(BuildContext context, String title, String body, String time) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text(time, style: const TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 4),
          Text(body, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
    );
  }
}

class StudentAttendanceTab extends StatelessWidget {
  const StudentAttendanceTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(
            children: [
              const Text('Overall Attendance', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 4),
              const Text('88.5%', style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
              const SizedBox(height: 4),
              const Text('42 of 48 sessions attended', style: TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const Text('Subject Breakdown', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 10),
        _buildSubjectRow(context, 'Advanced Web Architecture', '18/20 Attended', 0.90),
        _buildSubjectRow(context, 'Database Systems & Prisma', '14/16 Attended', 0.875),
        _buildSubjectRow(context, 'Software Engineering', '10/12 Attended', 0.833),
      ],
    );
  }

  Widget _buildSubjectRow(BuildContext context, String subject, String stat, double percent) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(subject, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text('${(percent * 100).toStringAsFixed(1)}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF10B981))),
            ],
          ),
          const SizedBox(height: 6),
          LinearProgressIndicator(value: percent, color: const Color(0xFF10B981), backgroundColor: Theme.of(context).dividerColor),
          const SizedBox(height: 4),
          Text(stat, style: const TextStyle(fontSize: 10, color: Colors.grey)),
        ],
      ),
    );
  }
}

class StudentTimetableTab extends StatelessWidget {
  const StudentTimetableTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Weekly Schedule', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 12),
        _buildDayHeader('MONDAY'),
        _buildTimetableCard(context, '09:00 AM', 'Advanced Web Architecture', 'Lab 3', 'Prof. Anish Patil'),
        _buildTimetableCard(context, '11:00 AM', 'Database Management Systems', 'Hall B', 'Dr. S. Sharma'),
        const SizedBox(height: 12),
        _buildDayHeader('TUESDAY'),
        _buildTimetableCard(context, '10:00 AM', 'Cloud Computing & DevOps', 'Lab 1', 'Prof. V. Gupta'),
      ],
    );
  }

  Widget _buildDayHeader(String day) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Text(day, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.indigo, letterSpacing: 0.8)),
    );
  }

  Widget _buildTimetableCard(BuildContext context, String time, String subject, String room, String teacher) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          Text(time, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(subject, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text('Room $room • $teacher', style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class StudentNotesResultsTab extends StatelessWidget {
  const StudentNotesResultsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Study Material & Notes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 10),
        _buildNoteItem(context, 'Advanced Web Architecture Notes.pdf', 'Uploaded by Prof. Anish Patil'),
        _buildNoteItem(context, 'Prisma ORM Cheat Sheet.pdf', 'Uploaded by Dr. S. Sharma'),
        _buildNoteItem(context, 'NestJS Backend Architecture Guidelines.pdf', 'Uploaded by System Admin'),
        const SizedBox(height: 20),
        const Text('Academic Results', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 10),
        _buildResultCard(context, 'Semester V Final Exam', '9.20 CGPA', 'Grade: O'),
        _buildResultCard(context, 'Semester IV Final Exam', '8.90 CGPA', 'Grade: A+'),
      ],
    );
  }

  Widget _buildNoteItem(BuildContext context, String title, String subtitle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: const Icon(Icons.picture_as_pdf, color: Colors.redAccent),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        trailing: IconButton(
          icon: const Icon(Icons.download_rounded, color: Colors.indigo),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Downloading $title...')),
            );
          },
        ),
      ),
    );
  }

  Widget _buildResultCard(BuildContext context, String exam, String gpa, String grade) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(exam, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text(grade, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
          Text(gpa, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.indigo)),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// TEACHER TABS
// -----------------------------------------------------------------------------
class TeacherOverviewTab extends StatelessWidget {
  final String name;
  final String empId;

  const TeacherOverviewTab({Key? key, required this.name, required this.empId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome, $name', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 2),
              Text('Employee ID: $empId • Computer Engineering Dept', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('Today\'s Assigned Classes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 10),
        _buildTeacherClassCard(context, 'Advanced Web Architecture', '09:00 AM - 10:30 AM', '64 Students Enrolled', true),
        _buildTeacherClassCard(context, 'Full Stack Web Lab', '01:30 PM - 03:30 PM', '32 Students Enrolled', false),
      ],
    );
  }

  Widget _buildTeacherClassCard(BuildContext context, String title, String time, String info, bool isDone) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text('$time • $info', style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
          Chip(
            label: Text(isDone ? 'Marked' : 'Pending', style: TextStyle(fontSize: 10, color: isDone ? Colors.green : Colors.orange)),
            backgroundColor: (isDone ? Colors.green : Colors.orange).withOpacity(0.15),
          ),
        ],
      ),
    );
  }
}

class TeacherAttendanceTab extends StatelessWidget {
  const TeacherAttendanceTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Mark Attendance', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 12),
        _buildAttendanceMarkRow(context, 'Anish Patil (2026CS101)'),
        _buildAttendanceMarkRow(context, 'Rohan Sharma (2026CS102)'),
        _buildAttendanceMarkRow(context, 'Priya Verma (2026CS103)'),
      ],
    );
  }

  Widget _buildAttendanceMarkRow(BuildContext context, String name) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          Row(
            children: [
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, padding: const EdgeInsets.symmetric(horizontal: 10)),
                child: const Text('Present', style: TextStyle(fontSize: 11, color: Colors.white)),
              ),
              const SizedBox(width: 6),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10)),
                child: const Text('Absent', style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class TeacherNotesTab extends StatelessWidget {
  const TeacherNotesTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Upload Notes & Assignments', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('File picker initiated for Cloud storage upload...')),
              );
            },
            icon: const Icon(Icons.upload_file_rounded),
            label: const Text('Select PDF / File to Upload'),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              backgroundColor: Theme.of(context).primaryColor,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class TeacherStudentsTab extends StatelessWidget {
  const TeacherStudentsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Student Roster', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 10),
        ListTile(
          leading: const CircleAvatar(child: Text('AP')),
          title: const Text('Anish Patil', style: TextStyle(fontWeight: FontWeight.bold)),
          subtitle: const Text('PRN: 2026CS101 • Attendance: 88.5%'),
        ),
      ],
    );
  }
}

// -----------------------------------------------------------------------------
// ADMIN TABS
// -----------------------------------------------------------------------------
class AdminOverviewTab extends StatelessWidget {
  final String name;
  final String tenantId;

  const AdminOverviewTab({Key? key, required this.name, required this.tenantId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('System Administrator Workspace', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 4),
              Text(getCollegeName(tenantId), style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('Live System Health (WebSockets)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 10),
        _buildMetricRow('PostgreSQL Database', 'CONNECTED (12ms)', Colors.green),
        _buildMetricRow('Redis Cache Gateway', 'ACTIVE (2ms)', Colors.green),
        _buildMetricRow('Active User Sessions', '142 Online', Colors.indigo),
      ],
    );
  }

  Widget _buildMetricRow(String title, String val, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black12,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          Text(val, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }
}

class AdminTimetableTab extends StatelessWidget {
  final String tenantId;
  const AdminTimetableTab({Key? key, required this.tenantId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Timetable Publishing Engine', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Timetable version published to student/teacher portals.')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, foregroundColor: Colors.white),
            child: const Text('Publish Timetable Version 2026-v1'),
          ),
        ],
      ),
    );
  }
}

class AdminAnnouncementsTab extends StatelessWidget {
  const AdminAnnouncementsTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Broadcast Campus Announcement', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          const TextField(
            decoration: InputDecoration(hintText: 'Enter announcement title...'),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Announcement broadcasted via WebSockets & Push Notifications.')),
              );
            },
            child: const Text('Broadcast Notification'),
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// PROFILE TAB (COMMON)
// -----------------------------------------------------------------------------
class ProfileTab extends StatelessWidget {
  final String name;
  final String role;
  final String idVal;
  final String tenantId;
  final VoidCallback toggleTheme;

  const ProfileTab({
    Key? key,
    required this.name,
    required this.role,
    required this.idVal,
    required this.tenantId,
    required this.toggleTheme,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: Column(
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: Theme.of(context).primaryColor,
                child: Text(name[0], style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
              const SizedBox(height: 10),
              Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              Text('$role • $idVal', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 4),
              Text(getCollegeName(tenantId), style: const TextStyle(fontSize: 11, color: Colors.indigo, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        ListTile(
          leading: const Icon(Icons.dark_mode_outlined),
          title: const Text('Toggle Dark / Light Theme'),
          onTap: toggleTheme,
        ),
        ListTile(
          leading: const Icon(Icons.security_rounded),
          title: const Text('Security & Active Sessions'),
          subtitle: const Text('JWT Authentication • Encrypted Token Storage'),
        ),
        ListTile(
          leading: const Icon(Icons.logout_rounded, color: Colors.redAccent),
          title: const Text('Logout Session', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
          onTap: () {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => LoginScreen(toggleTheme: toggleTheme)),
            );
          },
        ),
      ],
    );
  }
}
