import sys
import joblib

def debug(msg):
    print(f"[DEBUG] {msg}", file=sys.stderr)  # logs go to stderr

try:
    debug("Loading model...")
    model = joblib.load('E:/EMAIL_ASSITANT_PROJECT/ml_model/spam_model.pkl')

except Exception as e:
    print("Failed to load model:", e, file=sys.stderr)
    sys.exit(1)

if len(sys.argv) < 2:
    print("No file path provided", file=sys.stderr)
    sys.exit(1)

file_path = sys.argv[1]

try:
    debug(f"Reading file: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        email = f.read()

    prediction = model.predict([email])
    
    # ✅ Final output should ONLY be SPAM or NOT_SPAM
    print("SPAM" if prediction[0] == 1 else "NOT_SPAM")
    sys.exit(0)

except Exception as e:
    print("Error during prediction:", e, file=sys.stderr)
    sys.exit(2)
