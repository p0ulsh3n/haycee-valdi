import socket
import sys
import threading


def pipe(source: socket.socket, destination: socket.socket) -> None:
    try:
        while True:
            data = source.recv(65536)
            if not data:
                break
            destination.sendall(data)
    except OSError:
        pass
    finally:
        # Preserve the other direction. A TCP peer may half-close its write
        # side while still expecting responses; closing both sockets here
        # would tear down the Valdi daemon session after the first packet.
        try:
            destination.shutdown(socket.SHUT_WR)
        except OSError:
            pass


def relay_pair(client: socket.socket, target: socket.socket) -> None:
    first = threading.Thread(target=pipe, args=(client, target), daemon=True)
    second = threading.Thread(target=pipe, args=(target, client), daemon=True)
    first.start()
    second.start()
    first.join()
    second.join()

    for connection in (client, target):
        try:
            connection.close()
        except OSError:
            pass


listen_host = sys.argv[1]
listen_port = int(sys.argv[2])
target_host = sys.argv[3]
target_port = int(sys.argv[4])

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind((listen_host, listen_port))
server.listen(32)

while True:
    client, _ = server.accept()
    try:
        target = socket.create_connection((target_host, target_port), timeout=5)
        # The timeout is only for establishing the next hop. Keep the
        # established Valdi tunnel blocking indefinitely; a 5-second read
        # timeout disconnects otherwise-idle hot-reload sessions.
        target.settimeout(None)
    except OSError:
        client.close()
        continue
    for connection in (client, target):
        connection.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
        connection.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    threading.Thread(target=relay_pair, args=(client, target), daemon=True).start()
