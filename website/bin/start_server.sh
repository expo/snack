#!/bin/sh
#
# Setup a work space called `snack` that
# launches the projects you might need 
# - snack server
# - www and api server
# - snack-sdk
#

session="snack"

# set up tmux
# create a new tmux session, starting vim from a saved session in the new window
tmux kill-session -t "$session"
tmux new-session -d -s $session 

# Select pane 1, run snack server
tmux selectp -t 1 
tmux send-keys "yarn start" C-m 

# Split pane 1 horizontal by 65%, start web & api server
tmux splitw -h -p 35
tmux send-keys "cd ../www; yarn start" C-m 

# Select pane 1
tmux selectp -t 1

# snack-sdk (moved to expo/snack monorepo)
# tmux new-window -t $session:1 -n snack-sdk
# tmux send-keys "cd ../../libraries/snack-sdk; yarn watch" C-m

# snack-app
tmux new-window -t $session:2 -n snack-app
tmux send-keys "cd ../../apps/snack; exp start" C-m

# return to main vim window
tmux select-window -t $session:0

# Finished setup, attach to the tmux session!
tmux attach-session -t $session
