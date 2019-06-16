#!/usr/bin/env /usr/bin/python3
from auto_everything.base import Python, Terminal
py = Python()
t = Terminal()

class Tools():
    def checklogs(self):
        path_of_log_file = t.fix_path("./__main.log")
        t.run(f"tail -F {path_of_log_file}")

    def compile(self):
        commands = """
python3 -m nuitka --follow-imports main.py --output-dir=build
#python3 -m nuitka --standalone --follow-imports main.py --output-dir=build
        """
        t.run(commands)
        
    def push(self, comment):
        t.run('git add .')
        t.run('git commit -m "{}"'.format(comment))
        t.run('git push origin')

    def pull(self):
        t.run("""
git fetch --all
git reset --hard origin/master
""")

py.fire(Tools)
