# TGAsk

A telegram bot aims to kill spam&ad and do a simple verifying.

#### Features

Delete any group enter notifacation since it may contain AD.

#### Todo

If they can't answer a question in 20 seconds, we kick them out.

#### Usage

```bash
# Change the TOKEN inside of run.sh
./run.sh
```

or

```bash
sudo apt install golang -y

#go get -d -u -t ./... && go mod tidy

go run <bot_token> &
```

#### For developers

##### Test

```bash
go test tests/database_test.go #all test functions will run in a sequence way
```

##### Build

```bash
mkdir binary
cd binary
gox -output="TGbot_{{.OS}}_{{.Arch}}" -osarch="linux/amd64" -osarch="darwin/arm64" ../

#gox -output="LocalShow_{{.OS}}_{{.Arch}}" -osarch="linux/amd64" -osarch="linux/arm64" -osarch="windows/amd64" -osarch="windows/386" ../
```

##### Thinking

###### 1

Create a basic database table to save new_user_record.

###### 2

We need to create a new table to save temporary messages.

message_id, chat_id, user_id

We only save those messages that inside of the old 'new_user_record' table. (Include those messages that was sent by this bot)

When we kick out a user, we delete all messages that was related to that user.

###### 3

I don't think Golang is a good programming language, because:

1. It doesn't have `null` type, for dart or python or javascript or java, they all have this concept.

2. It doesn't have `try-catch` mechanism, which is super bad
