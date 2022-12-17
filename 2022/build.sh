#!/bin/sh

#sudo apt install golang -y
#go get ./... && go mod tidy

name="TGbot"

go install github.com/mitchellh/gox@latest
export PATH=~/go/bin:$PATH

mkdir binary
cd binary
gox -output="${name}_{{.OS}}_{{.Arch}}" -osarch="linux/amd64" -osarch="darwin/arm64" ../

executable_target_path="$(pwd)/${name}_linux_amd64"
chmod 777 $executable_target_path

remind="$executable_target_path <bot_token>"
echo '\n'
echo $remind

#rsync -avh --progress ./* root@104.292.209.163:/root/tgask/