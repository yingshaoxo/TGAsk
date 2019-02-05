# TGAsk
A telegram bot for asking question to new chat member.

#### Features
If they can not answer the question in on minute, they will be kicked out as quilckly as possible.

#### Docker
```
sudo docker run -d -e telegram_bot_token=TOKEN -e master_chat_id=YOU_CHAT_ID --name tgask yingshaoxo/tgask
```

#### Docker-Compose
First change `docker-compose.yml`

Then run `docker-compose up -d`
