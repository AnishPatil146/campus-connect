import 'package:flutter/material.dart';

String getCollegeName(String id) {
  switch (id) {
    case 'college-a':
      return "Pushpalata Mhatre Women's College of Arts, Commerce & Science";
    case 'college-b':
      return "Balasaheb Mhatre College of Science (Junior)";
    case 'college-c':
      return "Balasaheb Mhatre College of Science (Senior)";
    default:
      return "Unknown College";
  }
}

Color getCollegeColor(String id) {
  switch (id) {
    case 'college-a':
      return const Color(0xFF3B82F6); // Blue
    case 'college-b':
      return const Color(0xFF8B5CF6); // Purple
    case 'college-c':
      return const Color(0xFF10B981); // Emerald
    default:
      return const Color(0xFF6B7280); // Gray
  }
}
