package com.directrix.Directrix;

import java.net.UnknownHostException;

public class Main {
    public static final char SEPARATOR = (char) 7;

    public static Server server;

    public static void main(String[] args) throws UnknownHostException {
        server = new Server();
        server.listen(8080);
        Logger.log(Logger.Level.INFO, "Server started");
        Runtime.getRuntime().addShutdownHook(new Thread(new Runnable() {
            @Override
            public void run() {
                Logger.log(Logger.Level.INFO, "Server stopped");
            }
        }));
    }
}
