import urllib.request
import urllib.error
import json

SUPABASE_URL = 'https://meeljtyblixcdfymgaym.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZWxqdHlibGl4Y2RmeW1nYXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjM0NTEsImV4cCI6MjA5NzkzOTQ1MX0.b1sEpavYWZOIKoKAGcPLOgQKT2I8K6kAYBjo-c_dTgo'

def test_post(table, payload, prefer_header=None):
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    if prefer_header:
        headers['Prefer'] = prefer_header

    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}",
        data=json.dumps(payload).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            print(f"[{table}] Success Status: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"[{table}] HTTP Error: {e.code}")
        print(f"[{table}] Error Details: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"[{table}] Unexpected Error: {str(e)}")

print("Testing write on 'planilhas'...")
test_post('planilhas', {'data_encarte': '2026-08', 'url_google': 'https://example.com/encarte'}, 'resolution=merge')

print("\nTesting write on 'ofertas'...")
test_post('ofertas', {'data_oferta': '2026-08', 'url_ofertas': 'https://example.com/ofertas'}, 'resolution=merge')

print("\nTesting write on 'integracoes'...")
test_post('integracoes', {'data_integracao': '2026-08', 'sistema_erp': 'Alpha7', 'descricao': 'App Encarte', 'url_txt': 'https://example.com/txt'}, 'resolution=merge')
