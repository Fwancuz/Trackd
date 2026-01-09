/**
 * Supabase RPC Integration Diagnostic Tool
 * 
 * Use this to verify that your Supabase setup is working correctly
 * Run in browser console: import { diagnosticCheck } from './rpcDiagnostic.js'
 */

import { supabase } from './supabaseClient';

export const diagnosticCheck = async () => {
  console.log('🔍 Starting RPC Diagnostic Check...\n');

  const checks = {
    supabaseClient: false,
    authentication: false,
    rpcAccess: false,
    databaseSchema: false,
    overallStatus: 'PENDING'
  };

  try {
    // Check 1: Supabase Client
    console.log('1️⃣  Checking Supabase Client...');
    if (supabase) {
      console.log('   ✅ Supabase client initialized');
      console.log('   📍 URL:', supabase.supabaseUrl);
      checks.supabaseClient = true;
    } else {
      console.error('   ❌ Supabase client not initialized');
    }

    // Check 2: Authentication
    console.log('\n2️⃣  Checking Authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (user) {
      console.log('   ✅ User authenticated');
      console.log('   👤 User ID:', user.id);
      console.log('   📧 Email:', user.email);
      checks.authentication = true;
    } else {
      console.warn('   ⚠️  Not authenticated (OK if testing without login)');
      checks.authentication = true; // Not a blocker
    }

    // Check 3: RPC Access - Test a simple RPC
    console.log('\n3️⃣  Checking RPC Access...');
    try {
      const { data, error } = await supabase
        .rpc('create_invite_link', { expires_in_hours: 24 })
        .limit(1);

      if (error) {
        if (error.code === '404') {
          console.warn('   ❌ RPC function not found (404)');
          console.log('   💡 Make sure you executed LINK_BASED_INVITE_MIGRATION.sql in Supabase');
          console.log('   📝 Error details:', error.message);
        } else if (error.message?.includes('permission denied')) {
          console.warn('   ❌ Permission denied for RPC');
          console.log('   💡 Check Row Level Security (RLS) policies');
          console.log('   📝 Error details:', error.message);
        } else {
          console.error('   ❌ RPC error:', error.message);
        }
        checks.rpcAccess = false;
      } else {
        console.log('   ✅ RPC access working');
        if (data) {
          console.log('   📊 Sample response received');
        }
        checks.rpcAccess = true;
      }
    } catch (err) {
      console.error('   ❌ Exception during RPC test:', err.message);
      checks.rpcAccess = false;
    }

    // Check 4: Database Schema
    console.log('\n4️⃣  Checking Database Schema...');
    try {
      // Check if invite_links table exists
      const { data: tableInfo, error: tableError } = await supabase
        .from('invite_links')
        .select('count', { count: 'exact' })
        .limit(1);

      if (tableError) {
        if (tableError.message?.includes('does not exist')) {
          console.warn('   ❌ invite_links table not found');
          console.log('   💡 Execute LINK_BASED_INVITE_MIGRATION.sql in Supabase SQL Editor');
          checks.databaseSchema = false;
        } else {
          console.error('   ⚠️  Table check error:', tableError.message);
          checks.databaseSchema = false;
        }
      } else {
        console.log('   ✅ invite_links table exists');
        checks.databaseSchema = true;
      }
    } catch (err) {
      console.error('   ❌ Exception checking database:', err.message);
      checks.databaseSchema = false;
    }

  } catch (err) {
    console.error('❌ Diagnostic check failed:', err.message);
  }

  // Summary
  console.log('\n📋 DIAGNOSTIC SUMMARY:');
  console.log('─'.repeat(50));
  console.log('Supabase Client:  ', checks.supabaseClient ? '✅ OK' : '❌ FAILED');
  console.log('Authentication:   ', checks.authentication ? '✅ OK' : '❌ FAILED');
  console.log('RPC Access:       ', checks.rpcAccess ? '✅ OK' : '❌ FAILED');
  console.log('Database Schema:  ', checks.databaseSchema ? '✅ OK' : '❌ FAILED');

  const passedChecks = Object.values(checks).filter(v => v === true).length;
  const totalChecks = Object.keys(checks).length - 1; // Exclude overallStatus

  if (passedChecks === totalChecks) {
    console.log('\n🎉 ALL CHECKS PASSED! System is ready.');
    checks.overallStatus = 'READY';
  } else if (passedChecks >= totalChecks - 1) {
    console.log('\n⚠️  PARTIAL - Some checks need attention');
    console.log('💡 See recommendations above');
    checks.overallStatus = 'PARTIAL';
  } else {
    console.log('\n🛑 CRITICAL - System not ready for production');
    console.log('💡 Fix the issues above before deploying');
    checks.overallStatus = 'BLOCKED';
  }

  console.log('─'.repeat(50));
  
  return checks;
};

export const testInviteFlow = async () => {
  console.log('\n🧪 Testing Complete Invite Flow...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Not authenticated. Please log in first.');
      return false;
    }

    // 1. Generate link
    console.log('1️⃣  Generating invite link...');
    const { data: linkData, error: linkError } = await supabase
      .rpc('create_invite_link', { expires_in_hours: 24 });

    if (linkError) {
      console.error('❌ Failed to generate link:', linkError.message);
      return false;
    }

    if (!linkData || linkData.length === 0) {
      console.error('❌ No link returned');
      return false;
    }

    const inviteCode = linkData[0].invite_code;
    console.log('✅ Link generated:', inviteCode);

    // 2. Get link details
    console.log('2️⃣  Verifying link details...');
    const { data: detailsData, error: detailsError } = await supabase
      .rpc('get_invite_details', { invite_code_param: inviteCode });

    if (detailsError) {
      console.error('❌ Failed to get details:', detailsError.message);
      return false;
    }

    console.log('✅ Link details verified');
    console.log('   Valid:', detailsData[0].valid);
    console.log('   Creator:', detailsData[0].created_by_email);

    // 3. List user's links
    console.log('3️⃣  Listing user\'s invite links...');
    const { data: listData, error: listError } = await supabase
      .rpc('get_my_invite_links');

    if (listError) {
      console.error('❌ Failed to list links:', listError.message);
      return false;
    }

    console.log('✅ Links listed:', listData.length, 'total');

    console.log('\n✅ Invite flow test PASSED!');
    return true;

  } catch (err) {
    console.error('❌ Test failed:', err.message);
    return false;
  }
};

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  window.rpcDiagnostic = {
    check: diagnosticCheck,
    testFlow: testInviteFlow
  };
  console.log('💡 RPC Diagnostic tools available. Run:');
  console.log('   window.rpcDiagnostic.check()  - Run full diagnostic');
  console.log('   window.rpcDiagnostic.testFlow() - Test invite flow');
}
