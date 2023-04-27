build:
	docker build -t voice-gpt .

run: 
	docker run -d -p 3000:3000 voice-gpt