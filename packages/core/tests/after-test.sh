cd ./server
SERVER_PID=`cat SERVER_PID`
CORS_SERVER_PID=`cat CORS_SERVER_PID`
pkill -P $SERVER_PID
pkill -P $CORS_SERVER_PID
rm SERVER_PID
rm CORS_SERVER_PID