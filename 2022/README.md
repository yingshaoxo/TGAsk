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
