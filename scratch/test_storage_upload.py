import urllib.request
import urllib.error

SUPABASE_URL = 'https://meeljtyblixcdfymgaym.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZWxqdHlibGl4Y2RmeW1nYXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjM0NTEsImV4cCI6MjA5NzkzOTQ1MX0.b1sEpavYWZOIKoKAGcPLOgQKT2I8K6kAYBjo-c_dTgo'

def test_storage_upload():
    # Caminho do teste
    bucket = 'arquivos_integracao'
    file_path = 'test_uploads/diagnostic_test.txt'
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{file_path}"
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'text/plain'
    }
    
    payload = b"Este e um teste de diagnostico de upload direto para o Supabase Storage."
    
    req = urllib.request.Request(
        url,
        data=payload,
        headers=headers,
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Upload Status: {response.status}")
            print(f"Response: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(f"Error Response: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")

test_storage_upload()
