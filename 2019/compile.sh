rm build -fr
rm dist -fr

#python3 -m nuitka --standalone --follow-imports --include-plugin-directory=/usr/local/lib/python3.7/dist-packages/telegram --include-plugin-directory=/usr/local/lib/python3.7/dist-packages/urllib3 --show-progress --show-scons main.py
#mkdir -p dist/main
#mv main.build build
#mv main.dist/* dist/main/
#rm main.dist -fr

pyinstaller main.py  --noconfirm
