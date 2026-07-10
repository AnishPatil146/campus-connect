import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'utils/college_utils.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables if available
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    // Fallback if env file doesn't load
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
  ThemeMode _themeMode = ThemeMode.system;

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
      // Premium Light Theme
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        primaryColor: const Color(0xFF2563EB),
        cardColor: Colors.white,
        dividerColor: const Color(0xFFE2E8F0),
        fontFamily: 'Inter',
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF2563EB),
          secondary: Color(0xFF3B82F6),
          background: Color(0xFFF8FAFC),
          surface: Colors.white,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          iconTheme: IconThemeData(color: Color(0xFF0F172A)),
          titleTextStyle: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w800,
            fontSize: 20,
            fontFamily: 'Outfit',
          ),
        ),
      ),
      // Premium Linear/Vercel Dark Theme
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primaryColor: const Color(0xFF38BDF8),
        cardColor: const Color(0xFF1E293B),
        dividerColor: const Color(0xFF334155),
        fontFamily: 'Inter',
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF38BDF8),
          secondary: Color(0xFF60A5FA),
          background: Color(0xFF0F172A),
          surface: Color(0xFF1E293B),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F172A),
          elevation: 0,
          iconTheme: IconThemeData(color: Color(0xFFF8FAFC)),
          titleTextStyle: TextStyle(
            color: Color(0xFFF8FAFC),
            fontWeight: FontWeight.w800,
            fontSize: 20,
            fontFamily: 'Outfit',
          ),
        ),
      ),
      home: LoginScreen(toggleTheme: toggleTheme),
    );
  }
}

class LoginScreen extends StatefulWidget {
  final VoidCallback toggleTheme;
  const LoginScreen({Key? key, required this.toggleTheme}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _secureStorage = const FlutterSecureStorage();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  String _selectedRole = 'STUDENT';
  String _selectedCollege = 'college-a';
  bool _isLoading = false;
  bool _isOffline = false;

  String get _apiUrl {
    final baseUrl = dotenv.env['API_URL'] ?? 'https://api.campusconnect.com';
    final devUrl = dotenv.env['API_URL_DEV'] ?? 'http://localhost:3000';
    final env = dotenv.env['ENVIRONMENT'] ?? 'production';
    return env == 'production' ? baseUrl : devUrl;
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
    });

    // Simulate backend connection
    await Future.delayed(const Duration(seconds: 1));

    final mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Encode(utf8.encode(jsonEncode({
      'email': _emailController.text.isNotEmpty ? _emailController.text : 'user@campusconnect.com',
      'role': _selectedRole,
      'collegeId': _selectedCollege,
    })))}.mocksignature";

    await _secureStorage.write(key: 'jwt_token', value: mockToken);
    await _secureStorage.write(key: 'user_role', value: _selectedRole);
    await _secureStorage.write(key: 'user_college', value: _selectedCollege);

    setState(() {
      _isLoading = false;
    });

    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => DashboardScreen(
            role: _selectedRole,
            collegeId: _selectedCollege,
            apiUrl: _apiUrl,
            toggleTheme: widget.toggleTheme,
            initialOffline: _isOffline,
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
        title: const Text('Campus Connect'),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: widget.toggleTheme,
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo and Branding
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Text(
                      'C',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Outfit',
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Campus Connect Mobile',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Outfit',
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Connected Academic Environment',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: isDark ? Colors.grey[400] : Colors.grey[600],
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 32),

              // Inputs Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Theme.of(context).dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sign In',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Outfit',
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email Address',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Role Selector
                    const Text('Select Role:', style: TextStyle(fontWeight: FontWeight.bold)),
                    Row(
                      children: ['STUDENT', 'TEACHER', 'ADMIN'].map((role) {
                        return Expanded(
                          child: Row(
                            children: [
                              Radio<String>(
                                value: role,
                                groupValue: _selectedRole,
                                onChanged: (value) {
                                  setState(() {
                                    _selectedRole = value!;
                                  });
                                },
                              ),
                              Expanded(
                                child: Text(
                                  role[0] + role.substring(1).toLowerCase(),
                                  style: const TextStyle(fontSize: 12),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),

                    // College Selector
                    const Text('Select Institution:', style: TextStyle(fontWeight: FontWeight.bold)),
                    DropdownButtonFormField<String>(
                      value: _selectedCollege,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      items: ['college-a', 'college-b', 'college-c'].map((collegeId) {
                        return DropdownMenuItem<String>(
                          value: collegeId,
                          child: Text(
                            getCollegeName(collegeId),
                            style: const TextStyle(fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedCollege = value!;
                        });
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Server Indicator
              Text(
                'Connecting to: $_apiUrl',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic),
              ),
              const SizedBox(height: 12),

              // Network Mock Switcher
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Checkbox(
                    value: _isOffline,
                    onChanged: (val) {
                      setState(() {
                        _isOffline = val ?? false;
                      });
                    },
                  ),
                  const Text('Simulate Offline Mode (Stage 13)', style: TextStyle(fontSize: 13)),
                ],
              ),
              const SizedBox(height: 12),

              // Login button
              ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text(
                        'Authenticate Portal',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  final String role;
  final String collegeId;
  final String apiUrl;
  final VoidCallback toggleTheme;
  final bool initialOffline;

  const DashboardScreen({
    Key? key,
    required this.role,
    required this.collegeId,
    required this.apiUrl,
    required this.toggleTheme,
    required this.initialOffline,
  }) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late bool _isOffline;
  
  // States for verification indicators
  bool _mockAttendanceMarked = false;
  bool _mockNotificationReceived = false;
  bool _mockFileUploaded = false;
  bool _mockReportDownloaded = false;
  
  List<String> _notes = ["Syllabus Overview.pdf", "Lecture 1 Slides.pdf", "Lab Assignment Checklist.docx"];
  List<Map<String, String>> _assignments = [
    {"title": "Database Schema Design", "due": "Tomorrow 11:59 PM"},
    {"title": "NestJS Swagger Document Docs", "due": "Next Monday"}
  ];
  List<Map<String, String>> _events = [
    {"title": "Annual Science Fair", "time": "July 15, 10:00 AM"},
    {"title": "Cloud Deployment Seminar", "time": "July 18, 2:00 PM"}
  ];

  @override
  void initState() {
    super.initState();
    _isOffline = widget.initialOffline;
  }

  void _triggerPushNotification() {
    setState(() {
      _mockNotificationReceived = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Firebase Notification: New Assignment posted by Administrator.'),
        backgroundColor: Colors.indigo,
      ),
    );
  }

  void _simulateFileUpload() {
    setState(() {
      _mockFileUploaded = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('File uploaded successfully to Cloudinary storage bucket!'),
        backgroundColor: Colors.teal,
      ),
    );
  }

  void _downloadReport() {
    setState(() {
      _mockReportDownloaded = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Downloaded PDF Report for college analytics successfully.'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final collegeColor = getCollegeColor(widget.collegeId);
    
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.role[0] + widget.role.substring(1).toLowerCase() + ' Dashboard'),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: widget.toggleTheme,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => LoginScreen(toggleTheme: widget.toggleTheme)),
              );
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // College Info Banner
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: collegeColor.withOpacity(0.4), width: 1.5),
              ),
              child: Row(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(color: collegeColor, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          getCollegeName(widget.collegeId),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'API Endpoint: ${widget.apiUrl}',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Connection & Check Status Widgets
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  avatar: Icon(
                    _isOffline ? Icons.signal_wifi_off : Icons.wifi,
                    size: 16,
                    color: _isOffline ? Colors.orange : Colors.green,
                  ),
                  label: Text(_isOffline ? 'Offline Mode' : 'Online'),
                  onPressed: () {
                    setState(() {
                      _isOffline = !_isOffline;
                    });
                  },
                ),
                ActionChip(
                  avatar: const Icon(Icons.notifications_active, size: 16, color: Colors.indigo),
                  label: const Text('Trigger Push Msg'),
                  onPressed: _triggerPushNotification,
                ),
                ActionChip(
                  avatar: const Icon(Icons.upload_file, size: 16, color: Colors.teal),
                  label: const Text('Simulate File Upload'),
                  onPressed: _simulateFileUpload,
                ),
                ActionChip(
                  avatar: const Icon(Icons.picture_as_pdf, size: 16, color: Colors.green),
                  label: const Text('Download Report'),
                  onPressed: _downloadReport,
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Verification Grid Items
            const Text('Verification Flow (Stage 13 Checklist)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, fontFamily: 'Outfit')),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 2.2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              children: [
                _buildStatusCard('Attendance', _mockAttendanceMarked, () {
                  setState(() {
                    _mockAttendanceMarked = !_mockAttendanceMarked;
                  });
                }, Icons.calendar_today, Colors.blue),
                _buildStatusCard('Push Notif Hook', _mockNotificationReceived, _triggerPushNotification, Icons.message, Colors.indigo),
                _buildStatusCard('File Upload', _mockFileUploaded, _simulateFileUpload, Icons.cloud_upload, Colors.teal),
                _buildStatusCard('Reports Access', _mockReportDownloaded, _downloadReport, Icons.insert_drive_file, Colors.purple),
              ],
            ),
            const SizedBox(height: 24),

            // Timetable & Attendance section
            _buildInteractiveListCard(
              title: 'Schedule / Attendance (Stage 13)',
              icon: Icons.access_time_filled,
              color: Colors.blue,
              child: Column(
                children: [
                  ListTile(
                    title: const Text('Advanced Web Architecture', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('09:00 AM - 10:30 AM | Lab 3', style: TextStyle(fontSize: 12)),
                    trailing: ElevatedButton(
                      onPressed: _isOffline ? null : () {
                        setState(() {
                          _mockAttendanceMarked = true;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Attendance recorded for Advanced Web Architecture!'), backgroundColor: Colors.blue),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _mockAttendanceMarked ? Colors.grey : Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text(_mockAttendanceMarked ? 'Present' : 'Mark Pres'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Notes / Study Material
            _buildInteractiveListCard(
              title: 'Notes & Resources',
              icon: Icons.library_books,
              color: Colors.teal,
              child: Column(
                children: _notes.map((note) => ListTile(
                  dense: true,
                  leading: const Icon(Icons.attachment, size: 20),
                  title: Text(note, style: const TextStyle(fontSize: 13)),
                  trailing: const Icon(Icons.download, size: 18),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Downloading file: $note...'), backgroundColor: Colors.teal),
                    );
                  },
                )).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // Assignments
            _buildInteractiveListCard(
              title: 'Assignments',
              icon: Icons.assignment,
              color: Colors.orange,
              child: Column(
                children: _assignments.map((assignment) => ListTile(
                  dense: true,
                  title: Text(assignment["title"]!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  subtitle: Text('Due: ${assignment["due"]!}', style: const TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 12),
                )).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // Events
            _buildInteractiveListCard(
              title: 'Campus Events',
              icon: Icons.event,
              color: Colors.pink,
              child: Column(
                children: _events.map((event) => ListTile(
                  dense: true,
                  title: Text(event["title"]!, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  subtitle: Text(event["time"]!, style: const TextStyle(fontSize: 11)),
                )).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(String title, bool checked, VoidCallback onTap, IconData icon, Color color) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(checked ? '✓ Success' : 'Pending', style: TextStyle(color: checked ? Colors.green : Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInteractiveListCard({
    required String title,
    required IconData icon,
    required Color color,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 8),
            child: Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, fontFamily: 'Outfit'),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          child,
        ],
      ),
    );
  }
}
