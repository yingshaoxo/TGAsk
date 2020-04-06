SERVICE="main"
if pgrep "$SERVICE" >/dev/null
then
    echo "$SERVICE is running"
else
    echo "$SERVICE stopped"
    export TOKEN=1:1aGD6_3bDz-ZSE
    nohup python3 main.py &
fi
