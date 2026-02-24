import socket
import json
import struct

def recvall(sock, n):
    """Helper function to receive n bytes or return None if EOF is hit."""
    data = bytearray()
    while len(data) < n:
        packet = sock.recv(n - len(data))
        if not packet:
            return None  # Connection closed or EOF
        data.extend(packet)
    return data


def receive_message(sock):
    """Receives a message from the socket."""
    # Read message length (first 4 bytes)
    raw_msglen = recvall(sock, 4)
    if not raw_msglen:
        return None
    # Unpack message length as 4-byte unsigned int in network byte order
    msglen = struct.unpack('!I', raw_msglen)[0]
    if msglen <= 0:
        print(f"Invalid message length: {msglen}")
        return None
    # Read the message data
    message = recvall(sock, msglen)
    if message is None:
        print(f"Failed to receive message of length {msglen}")
        return None
    return message

def handle_client(conn, addr):
    with conn:
        print(f'Connected by {addr}')
        while True:
            message = receive_message(conn)
            # Connection to edge has been closed
            if message is None:
                print(f'Client {addr} disconnected')
                break

            obj = json.loads(message.decode('utf-8'))

            if obj['event'] == "session_data":
                print(f'Edge connected with track {obj['data']['track_name']} and car {
                    obj['data']['car_name']}')
            else:
                print(f"Speed: {obj['data']['speed']}")


def start_edge_communication(host='127.0.0.1', port=65432):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((host, port))
        server_socket.listen()
        print(f"Server listening on {host}:{port}")

        conn, addr = server_socket.accept()
        handle_client(conn, addr)

if __name__ == "__main__":
    start_edge_communication()
