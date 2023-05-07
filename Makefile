build:
	docker build -t voice-gpt .

run: 
	docker compose up -d 

stop:
	docker stop voice-gpt

remove:
	docker rm voice-gpt -f