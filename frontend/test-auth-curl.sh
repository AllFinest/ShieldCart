#!/bin/bash
# Get CSRF
curl -c cookies.txt -s "http://localhost:5000/api/csrf-token" > /tmp/csrf.json
TOKEN=$(grep -o '"csrfToken":"[^"]*' /tmp/csrf.json | grep -o '[^"]*$')
echo "Token: $TOKEN"

# Register
curl -v -b cookies.txt -c cookies.txt -X POST "http://localhost:5000/api/auth/register" \
-H "Content-Type: application/json" \
-H "x-csrf-token: $TOKEN" \
-d '{"email":"tester@example.com","password":"Password123!","firstName":"Test","lastName":"User"}'
