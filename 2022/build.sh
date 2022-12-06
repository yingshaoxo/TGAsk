#!/bin/sh

#sudo apt install golang -y
#go get ./... && go mod tidy

mkdir binary
cd binary
gox -output="TGbot_{{.OS}}_{{.Arch}}" -osarch="linux/amd64" -osarch="darwin/arm64" ../

executable_target_path="$(pwd)/TGbot_linux_amd64"
chmod 777 $executable_target_path

remind="$executable_target_path <bot_token>"
echo '\n'
echo $remind