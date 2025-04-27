from transformers import pipeline

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

def handler(request):
    if request.method != "POST":
        return {
            "statusCode": 405,
            "body": "Method Not Allowed"
        }

    try:
        data = request.json()
        text = data.get('text', '')

        if not text:
            return {
                "statusCode": 400,
                "body": "No text provided."
            }

        summary = summarizer(text, max_length=150, min_length=30, do_sample=False)
        return {
            "statusCode": 200,
            "body": summary[0]['summary_text']
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": str(e)
        }
