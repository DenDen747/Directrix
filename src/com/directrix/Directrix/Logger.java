package com.directrix.Directrix;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.util.Date;

public class Logger {
    public static void log(Logger.Level level, String message) {
        try {
            Locale.getDirectory("data");
            BufferedWriter out = new BufferedWriter(new FileWriter("data/main.log", true));
            String s = "[" + new Date() + "] [" + level + "]: " + message;
            System.out.println(s);
            out.write(s);
            out.newLine();
            out.flush();
            out.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public enum Level {
        INFO,
        WARN,
        ERROR,
        REQUEST,
        RESPONSE
    }
}
