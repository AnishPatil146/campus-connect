import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:campus_connect_mobile/main.dart';
import 'package:campus_connect_mobile/utils/college_utils.dart';

void main() {
  testWidgets('App renders branding name and title', (WidgetTester tester) async {
    // Build the application
    await tester.pumpWidget(const CampusConnectApp());

    // Verify key login elements
    expect(find.text('Campus Connect'), findsOneWidget);
    expect(find.text('Campus Connect Mobile'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
  });

  test('College name utilities translation matches schema', () {
    expect(getCollegeName('college-a'), contains("Pushpalata Mhatre Women's College"));
    expect(getCollegeName('college-b'), contains("Balasaheb Mhatre College of Science"));
    expect(getCollegeName('college-c'), contains("Balasaheb Mhatre College of Science"));
    expect(getCollegeName('unknown-id'), equals('Unknown College'));
  });
}
