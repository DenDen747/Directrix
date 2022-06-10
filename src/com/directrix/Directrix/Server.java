package com.directrix.Directrix;

import com.denesgarda.Socketeer.Connection;
import com.denesgarda.Socketeer.Queueable;
import com.denesgarda.Socketeer.SocketeerServer;
import com.denesgarda.Socketeer.event.ClientConnectEvent;
import com.denesgarda.Socketeer.event.ClientDisconnectEvent;
import com.denesgarda.Socketeer.event.Event;
import com.denesgarda.Socketeer.event.ReceiveEvent;

import java.io.IOException;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.concurrent.atomic.AtomicLong;

public class Server extends SocketeerServer {
    public AtomicLong IDManager = new AtomicLong(0);
    public LinkedList<Instance> instances = new LinkedList<>();

    public Server() throws UnknownHostException {

    }

    @Override
    public void onEvent(Event event) {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (event instanceof ClientConnectEvent) {
                        Logger.log(Logger.Level.INFO, ((ClientConnectEvent) event).getConnection().getOtherEnd().getAddress() + " connected");
                    }
                    if (event instanceof ReceiveEvent) {
                        String[] args = ((ReceiveEvent) event).getData().split(String.valueOf(Main.SEPARATOR), -1);
                        Instance instance = getInstance(((ReceiveEvent) event).getConnection());
                        if (instance == null) {
                            Logger.log(Logger.Level.REQUEST, ((ReceiveEvent) event).getConnection().getOtherEnd().getAddress() + " executed " + Arrays.toString(args));

                            if (args[0].equals("login")) {
                                if (args.length == 3) {
                                    if (Locale.validate(args[1], args[2])) {
                                        send(((ReceiveEvent) event).getConnection(), "202");
                                        Logger.log(Logger.Level.INFO, ((ReceiveEvent) event).getConnection().getOtherEnd().getAddress() + " logged in to the account " + args[1]);
                                        instances.add(new Instance(IDManager.incrementAndGet(), args[1], ((ReceiveEvent) event).getConnection()));
                                    } else {
                                        send(((ReceiveEvent) event).getConnection(), "401");
                                        Logger.log(Logger.Level.INFO, ((ReceiveEvent) event).getConnection().getOtherEnd().getAddress() + " attempted to log in using invalid credentials");
                                    }
                                } else {
                                    send(((ReceiveEvent) event).getConnection(), "400");
                                    Logger.log(Logger.Level.INFO, ((ReceiveEvent) event).getConnection().getOtherEnd().getAddress() + " sent a bad request");
                                }
                            } else if (args[0].equals("signup")) {
                                if (args.length == 3) {
                                    if (Locale.usernameExists(args[1])) {
                                        send(((ReceiveEvent) event).getConnection(), "406" + Main.SEPARATOR + "Username taken");
                                        Logger.log(Logger.Level.INFO, ((ReceiveEvent) event).getConnection().getOtherEnd().getAddress() + " attempted to sign up using a taken username");
                                    } else {
                                        if (args[1].isBlank()) {
                                            send(((ReceiveEvent) event).getConnection(), "406" + Main.SEPARATOR + "Blank username");
                                            Logger.log(Logger.Level.INFO, ((ReceiveEvent) event).getConnection().getOtherEnd().getAddress() + " attempted to sign up using a blank username");
                                        } else {
                                            Locale.createAccount(args[1], args[2]);
                                            send(((ReceiveEvent) event).getConnection(), "201");
                                            Logger.log(Logger.Level.INFO, ((ReceiveEvent) event).getConnection().getOtherEnd().getAddress() + " signed up using the username " + args[1]);
                                            instances.add(new Instance(IDManager.incrementAndGet(), args[1], ((ReceiveEvent) event).getConnection()));
                                        }
                                    }
                                } else {
                                    send(((ReceiveEvent) event).getConnection(), "400");
                                    Logger.log(Logger.Level.INFO, ((ReceiveEvent) event).getConnection().getOtherEnd().getAddress() + " sent a bad request");
                                }
                            } else {
                                send(((ReceiveEvent) event).getConnection(), "400");
                                Logger.log(Logger.Level.INFO, ((ReceiveEvent) event).getConnection().getOtherEnd().getAddress() + " sent a bad request");
                            }
                        } else {
                            Logger.log(Logger.Level.REQUEST, instance.username + " executed " + Arrays.toString(args));
                            if (args[0].equals("list")) {
                                send(instance, "200" + Main.SEPARATOR + Locale.getConversations(instance.username));
                                Logger.log(Logger.Level.INFO, instance.username + " requested a list of conversations");
                            } else {
                                send(instance, "400");
                                Logger.log(Logger.Level.INFO, instance.username + " sent a bad request");
                            }
                        }
                    }
                    if (event instanceof ClientDisconnectEvent) {
                        for (Instance instance : instances) {
                            if (instance.connection.equals(((ClientDisconnectEvent) event).getConnection())) {
                                instances.remove(instance);
                                Logger.log(Logger.Level.INFO, instance.username + " disconnected");
                            }
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
        thread.start();
    }

    public String nextResponse(Connection connection) {
        String[] response = new String[1];
        connection.nextIn(new Queueable() {
            @Override
            public void nextIn(String s) throws IOException {
                response[0] = s;
            }
        });
        while (response[0] == null) {
            try {
                Thread.sleep(2);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        return response[0];
    }

    public Instance getInstance(Connection connection) {
        for (Instance instance : instances) {
            if (instance.connection.equals(connection)) {
                return instance;
            }
        }
        return null;
    }

    public void send(Connection connection, String message) throws IOException {
        connection.send(message);
        Logger.log(Logger.Level.RESPONSE, "Response to " + connection.getOtherEnd().getAddress() + " " + Arrays.toString(message.split(String.valueOf(Main.SEPARATOR), -1)));
    }

    public void send(Instance instance, String message) throws IOException {
        instance.connection.send(message);
        Logger.log(Logger.Level.RESPONSE, "Response to " + instance.username + " " + Arrays.toString(message.split(String.valueOf(Main.SEPARATOR), -1)));
    }
}
