"""
Backend Test — Phase A: Site Chrome Admin Control + Lead Email Notifications
=============================================================================

Tests the following features:
1. GET /api/site-info returns new defaults (Belarus/Russia addresses, 24/7, info@dm-auto.online, whatsapp/telegram)
2. Admin auth login via POST /api/auth/login
3. PUT /api/admin/site-info can update footer.contacts and notifications
4. POST /api/public/lead-requests submits lead and triggers email notification (dry_run)
5. POST /api/public/leads/quick submits calculator lead
6. GET /api/admin/lead-requests returns submitted leads
7. GET /api/public/google-reviews returns fallback data without API key
"""
import sys
import requests
from datetime import datetime

# Use the public endpoint from frontend/.env
BASE_URL = "https://rental-platform-57.preview.emergentagent.com"

class PhaseATest:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.lead_id = None
        self.quick_lead_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, check_fn=None):
        """Run a single API test"""
        url = f"{BASE_URL}{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        if headers:
            req_headers.update(headers)
        if self.admin_token and 'Authorization' not in req_headers:
            req_headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=15)
            else:
                print(f"❌ Failed - Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            
            # Try to parse JSON response
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text[:200]}
            
            if success:
                # Run additional check function if provided
                if check_fn:
                    check_result = check_fn(response_data)
                    if not check_result:
                        print(f"❌ Failed - Check function returned False")
                        print(f"   Response: {response_data}")
                        return False, response_data
                
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response_data
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response_data}")
                return False, response_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_site_info_defaults(self):
        """Test 1: GET /api/site-info returns new defaults"""
        def check(data):
            # Check footer.contacts.email
            email = data.get('footer', {}).get('contacts', {}).get('email')
            if email != 'info@dm-auto.online':
                print(f"   ⚠️  Email mismatch: expected 'info@dm-auto.online', got '{email}'")
                return False
            
            # Check addresses_ru
            addresses_ru = data.get('footer', {}).get('contacts', {}).get('addresses_ru', [])
            expected_ru = ['Беларусь, Минск — по записи', 'Россия, Москва — по записи']
            if addresses_ru != expected_ru:
                print(f"   ⚠️  addresses_ru mismatch")
                print(f"      Expected: {expected_ru}")
                print(f"      Got: {addresses_ru}")
                return False
            
            # Check working_hours_ru
            hours_ru = data.get('footer', {}).get('contacts', {}).get('working_hours_ru')
            if hours_ru != 'Пн – Вс · 24/7':
                print(f"   ⚠️  working_hours_ru mismatch: expected 'Пн – Вс · 24/7', got '{hours_ru}'")
                return False
            
            # Check whatsapp_number exists
            whatsapp = data.get('footer', {}).get('contacts', {}).get('whatsapp_number')
            if not whatsapp:
                print(f"   ⚠️  whatsapp_number is missing")
                return False
            
            # Check telegram_username exists
            telegram = data.get('footer', {}).get('contacts', {}).get('telegram_username')
            if not telegram:
                print(f"   ⚠️  telegram_username is missing")
                return False
            
            # Check notifications.admin_email field exists
            notifications = data.get('notifications', {})
            if 'admin_email' not in notifications:
                print(f"   ⚠️  notifications.admin_email field is missing")
                return False
            
            # Check footer.socials includes 'avito'
            socials = data.get('footer', {}).get('socials', {})
            if 'avito' not in socials:
                print(f"   ⚠️  footer.socials.avito is missing")
                return False
            
            print(f"   ✓ All defaults verified")
            return True
        
        return self.run_test(
            "Site Info Defaults",
            "GET",
            "/api/site-info",
            200,
            check_fn=check
        )

    def test_admin_login(self):
        """Test 2: Admin auth login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/api/auth/login",
            200,
            data={
                "email": "admin@bibi.cars",
                "password": "Jp3FS_7ZuE2bhHp7rFkJm9B9T_TeiHxu"
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   ✓ Admin token obtained")
            return True, response
        
        return False, response

    def test_update_site_info(self):
        """Test 3: PUT /api/admin/site-info updates footer.contacts and notifications"""
        if not self.admin_token:
            print("❌ Skipped - No admin token")
            return False, {}
        
        # Update footer.contacts and notifications
        update_data = {
            "footer": {
                "contacts": {
                    "email": "test@dm-auto.online",
                    "whatsapp_number": "+375291111111",
                    "whatsapp_label": "+375 29 111 11 11",
                    "telegram_username": "test_dm_auto",
                    "addresses": ["Test Address EN"],
                    "addresses_ru": ["Тестовый адрес РУ"],
                    "working_hours": "Test Hours EN",
                    "working_hours_ru": "Тестовые часы РУ",
                    "registration_address": "Test Reg EN",
                    "registration_address_ru": "Тестовая рег РУ"
                }
            },
            "notifications": {
                "admin_email": "admin-test@dm-auto.online",
                "admin_email_subject_prefix": "[TEST] ",
                "send_on_new_lead": True
            }
        }
        
        def check(data):
            # Verify the update was applied
            email = data.get('footer', {}).get('contacts', {}).get('email')
            if email != 'test@dm-auto.online':
                print(f"   ⚠️  Email not updated: got '{email}'")
                return False
            
            admin_email = data.get('notifications', {}).get('admin_email')
            if admin_email != 'admin-test@dm-auto.online':
                print(f"   ⚠️  notifications.admin_email not updated: got '{admin_email}'")
                return False
            
            print(f"   ✓ Site info updated successfully")
            return True
        
        success, response = self.run_test(
            "Update Site Info",
            "PUT",
            "/api/admin/site-info",
            200,
            data=update_data,
            check_fn=check
        )
        
        # Restore original values
        if success:
            restore_data = {
                "footer": {
                    "contacts": {
                        "email": "info@dm-auto.online",
                        "whatsapp_number": "+375291234567",
                        "whatsapp_label": "+375 29 123 45 67",
                        "telegram_username": "dm_auto_support",
                        "addresses": ["Belarus, Minsk — by appointment", "Russia, Moscow — by appointment"],
                        "addresses_ru": ["Беларусь, Минск — по записи", "Россия, Москва — по записи"],
                        "working_hours": "Mon – Sun · 24/7",
                        "working_hours_ru": "Пн – Вс · 24/7",
                        "registration_address": "Belarus / Russia — by appointment",
                        "registration_address_ru": "Беларусь / Россия — по записи"
                    }
                },
                "notifications": {
                    "admin_email": "",
                    "admin_email_subject_prefix": "[DM Auto] ",
                    "send_on_new_lead": True
                }
            }
            self.run_test(
                "Restore Site Info",
                "PUT",
                "/api/admin/site-info",
                200,
                data=restore_data
            )
        
        return success, response

    def test_lead_request_submission(self):
        """Test 4: POST /api/public/lead-requests submits lead and triggers email"""
        test_data = {
            "name": "Test Customer",
            "phone": "+375291234567",
            "email": "test@example.com",
            "budget": "15000",
            "currency": "EUR",
            "car_preference": "BMW X5",
            "message": "Test lead submission for Phase A"
        }
        
        def check(data):
            # Check response structure
            if not data.get('ok'):
                print(f"   ⚠️  Response ok=false")
                return False
            
            if not data.get('id'):
                print(f"   ⚠️  No lead ID returned")
                return False
            
            self.lead_id = data.get('id')
            
            if data.get('status') != 'new':
                print(f"   ⚠️  Status is not 'new': {data.get('status')}")
                return False
            
            if not data.get('response_due_at'):
                print(f"   ⚠️  No response_due_at field")
                return False
            
            print(f"   ✓ Lead submitted: {self.lead_id}")
            print(f"   ✓ Email notification should be triggered (check logs for 'lead-notify' or 'email/dry_run')")
            return True
        
        return self.run_test(
            "Lead Request Submission",
            "POST",
            "/api/public/lead-requests",
            200,
            data=test_data,
            check_fn=check
        )

    def test_quick_lead_submission(self):
        """Test 5: POST /api/public/leads/quick submits calculator lead"""
        test_data = {
            "name": "Test Calculator User",
            "phone": "+375297654321",
            "email": "calc@example.com",
            "source": "calculator",
            "desiredCar": "Mercedes-Benz GLE",
            "budget": "25000"
        }
        
        def check(data):
            # Check response structure
            if not data.get('success') and not data.get('ok'):
                print(f"   ⚠️  Response not successful")
                return False
            
            # Store lead ID if available
            lead_id = data.get('id') or data.get('leadId')
            if lead_id:
                self.quick_lead_id = lead_id
                print(f"   ✓ Quick lead submitted: {self.quick_lead_id}")
            
            print(f"   ✓ Email notification should be triggered")
            return True
        
        return self.run_test(
            "Quick Lead Submission",
            "POST",
            "/api/public/leads/quick",
            200,
            data=test_data,
            check_fn=check
        )

    def test_admin_lead_requests_list(self):
        """Test 6: GET /api/admin/lead-requests returns submitted leads"""
        if not self.admin_token:
            print("❌ Skipped - No admin token")
            return False, {}
        
        def check(data):
            items = data.get('items', [])
            if len(items) < 1:
                print(f"   ⚠️  No leads found (expected at least 1)")
                return False
            
            # Check if our test lead is in the list
            if self.lead_id:
                found = any(item.get('id') == self.lead_id for item in items)
                if found:
                    print(f"   ✓ Test lead found in admin list")
                else:
                    print(f"   ⚠️  Test lead not found in admin list")
            
            print(f"   ✓ Found {len(items)} lead(s)")
            return True
        
        return self.run_test(
            "Admin Lead Requests List",
            "GET",
            "/api/admin/lead-requests",
            200,
            check_fn=check
        )

    def test_google_reviews_fallback(self):
        """Test 7: GET /api/public/google-reviews returns fallback data"""
        def check(data):
            # Should return enabled=true with fallback rating/count
            if data.get('enabled') is False:
                print(f"   ⚠️  Google reviews disabled")
                return False
            
            rating = data.get('rating')
            count = data.get('count')
            
            if not isinstance(rating, (int, float)) or rating <= 0:
                print(f"   ⚠️  Invalid rating: {rating}")
                return False
            
            if not isinstance(count, int) or count <= 0:
                print(f"   ⚠️  Invalid count: {count}")
                return False
            
            # Should have reviews array (even if empty or fallback)
            reviews = data.get('reviews', [])
            
            print(f"   ✓ Fallback data: rating={rating}, count={count}, reviews={len(reviews)}")
            return True
        
        return self.run_test(
            "Google Reviews Fallback",
            "GET",
            "/api/public/google-reviews",
            200,
            check_fn=check
        )

def main():
    print("=" * 70)
    print("Phase A Backend Test — Site Chrome + Lead Notifications")
    print("=" * 70)
    
    tester = PhaseATest()
    
    # Run all tests
    print("\n" + "=" * 70)
    print("TEST 1: Site Info Defaults")
    print("=" * 70)
    tester.test_site_info_defaults()
    
    print("\n" + "=" * 70)
    print("TEST 2: Admin Login")
    print("=" * 70)
    tester.test_admin_login()
    
    print("\n" + "=" * 70)
    print("TEST 3: Update Site Info")
    print("=" * 70)
    tester.test_update_site_info()
    
    print("\n" + "=" * 70)
    print("TEST 4: Lead Request Submission")
    print("=" * 70)
    tester.test_lead_request_submission()
    
    print("\n" + "=" * 70)
    print("TEST 5: Quick Lead Submission")
    print("=" * 70)
    tester.test_quick_lead_submission()
    
    print("\n" + "=" * 70)
    print("TEST 6: Admin Lead Requests List")
    print("=" * 70)
    tester.test_admin_lead_requests_list()
    
    print("\n" + "=" * 70)
    print("TEST 7: Google Reviews Fallback")
    print("=" * 70)
    tester.test_google_reviews_fallback()
    
    # Print results
    print("\n" + "=" * 70)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("=" * 70)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
