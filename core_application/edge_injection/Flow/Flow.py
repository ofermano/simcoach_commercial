import sys
import socket
import struct
import json
import platform
import os
import ac  # noqa: E402
import acsys  # noqa: E402
import struct
import threading

APP_NAME = 'Flow'

# Add the third party libraries to the path
try:
    if platform.architecture()[0] == "64bit":
        sysdir = "stdlib64"
    else:
        sysdir = "stdlib"
    sys.path.insert(
        len(sys.path), 'apps/python/{}/third_party'.format(APP_NAME))
    os.environ['PATH'] += ";."
    sys.path.insert(len(sys.path), os.path.join(
        'apps/python/{}/third_party'.format(APP_NAME), sysdir))
    os.environ['PATH'] += ";."
except Exception as e:
    ac.log("[Flow] Error importing libraries: %s" % e)

# Socket variables
host = '127.0.0.1'
port = 65432
client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
is_connected = False

time_from_last_send = 0
time_from_last_connection_try = 0

def printToConsole(msg):
    ac.log(msg)
    ac.console(msg)


def send_message(sock, message):
    try:
        message_bytes = json.dumps(message).encode('utf-8')
        length = len(message_bytes)
        sock.sendall(struct.pack('!I', length) + message_bytes)
    except Exception as err:
        printToConsole('Error sending message' + str(err))


def is_connection_alive():
    global client_socket
    try:
        # Send a small packet to test connection
        client_socket.send(b'')
        return True
    except socket.error:
        return False


def connect_to_hmi():
    global host, port, client_socket
    try:
        printToConsole('Trying to connect to HMI service')
        client_socket.connect((host, port))
        printToConsole('Connected to HMI service')

        data = {
            "track_name": ac.getTrackName(ac.getFocusedCar()),
            "car_name": ac.getCarName(ac.getFocusedCar())
        }

        message = {"event": "session_data", "data": data}

        send_message(client_socket, message)
    except Exception as err:
        printToConsole('Failed to connect to HMI service')


def acUpdate(deltaT):
    global time_from_last_send, client_socket, time_from_last_connection_try
    time_from_last_send = time_from_last_send + deltaT

    if is_connection_alive():
        if time_from_last_send >= 0.1:
            time_from_last_send = 0
            send_data()
    # except socket.error:
    else:
        time_from_last_connection_try = time_from_last_connection_try + deltaT
        if time_from_last_connection_try >= 3:
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            threading.Thread(target=connect_to_hmi).start()
            time_from_last_connection_try = 0


def send_data():
    global client_socket, time_from_last_send

    if not ac.isCarInPitline(ac.getFocusedCar()) and not ac.isCarInPit(ac.getFocusedCar()):

        data = {
            "speed": round(ac.getCarState(ac.getFocusedCar(), acsys.CS.SpeedKMH), 2),
        }

        message = {"event": "telemetry", "data": data}

        send_message(client_socket, message)


def acMain(ac_version):
    global APP_NAME
    appWindow = ac.newApp(APP_NAME)
    ac.setSize(appWindow, 200, 200)

    connect_to_hmi()

    return APP_NAME
