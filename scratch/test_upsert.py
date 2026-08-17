import urllib.request
import urllib.error
import json

SUPABASE_URL = 'https://meeljtyblixcdfymgaym.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZWxqdHlibGl4Y2RmeW1nYXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjM0NTEsImV4cCI6MjA5NzkzOTQ1MX0.b1sEpavYWZOIKoKAGcPLOgQKT2I8K6kAYBjo-c_dTgo'

# Simular o payload enviado pelo admin.js para salvar (upsert)
# No PostgREST (Supabase), upsert é feito via POST com o header Prefer: resolution=merge
payload = [
    {
        "data_campanha": "2026-09",
        "tipo_material": "horario-de-funcionamento",
        "url_drive": "https://drive.google.com/drive/folders/link_test"
    }
]

req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/marketing",
    data=json.dumps(payload).encode('utf-8'),
    headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge'
    },
    method='POST'
)

try:
    with urllib.request.urlopen(req) as response:
        print("Success Status:", response.status)
        print("Response:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error Status:", e.code)
    print("HTTP Error Response:", e.read().decode('utf-8'))
except Exception as e:
    print("Unexpected Error:", str(e))
