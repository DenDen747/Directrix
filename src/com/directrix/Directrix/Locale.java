package com.directrix.Directrix;

import com.denesgarda.Prop4j.data.PropertiesFile;
import com.directrix.Directrix.util.PropertiesUtil;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Locale {
    public static File getDirectory(String directory) {
        File file = new File(directory);
        if (!file.exists()) {
            file.mkdirs();
        }
        return file;
    }

    public static boolean usernameExists(String username) throws IOException {
        File accDir = getDirectory("data/accounts");
        boolean exists = false;
        for (File acc : accDir.listFiles()) {
            PropertiesFile account = new PropertiesFile(acc.getPath());
            if (account.getProperty("username").equals(username)) {
                exists = true;
                break;
            }
        }
        return exists;
    }

    public static void createAccount(String username, String password) throws IOException {
        File accDir = getDirectory("data/accounts");
        long ID = 0;
        for (File acc : accDir.listFiles()) {
            if (Long.parseLong(acc.getName().split("\\.")[0]) == ID) {
                ID ++;
            } else {
                break;
            }
        }
        File acc = new File(accDir + "/" + ID + ".properties");
        acc.createNewFile();
        PropertiesFile account = new PropertiesFile(acc.getPath());
        account.setProperty("username", username);
        account.setProperty("password", password);
    }

    public static boolean validate(String username, String password) throws IOException {
        File accDir = getDirectory("data/accounts");
        boolean valid = false;
        for (File acc : accDir.listFiles()) {
            PropertiesFile account = new PropertiesFile(acc.getPath());
            if (account.getProperty("username").equals(username) && account.getProperty("password").equals(password)) {
                valid = true;
            }
        }
        return valid;
    }

    public static File getAccount(String username) throws IOException {
        File accDir = getDirectory("data/accounts");
        for (File acc : accDir.listFiles()) {
            PropertiesFile account = new PropertiesFile(acc.getPath());
            if (account.getProperty("username").equals(username)) {
                return acc;
            }
        }
        return null;
    }

    public static String getConversations(String username) throws IOException {
        String conversations = "";
        File conDir = getDirectory("data/conversations");
        for (File con : conDir.listFiles()) {
            ArrayList<String> users = new ArrayList<>();
            try (BufferedReader br = new BufferedReader(new FileReader(con))) {
                String line;
                while ((line = br.readLine()) != null) {
                    users.add(line);
                }
            }
            String unreadRaw = PropertiesUtil.getPropertyNotNull(new PropertiesFile(getAccount(username).getPath()), "unread", "[]");
            unreadRaw = unreadRaw.substring(1, unreadRaw.length() - 1);
            List<String> unread = Arrays.asList(unreadRaw.split(", ", -1));
            if (users.contains(username)) {
                users.remove(username);
                conversations += (users.toString().substring(1, users.toString().length() - 1)) + Main.SEPARATOR;
                if (unread.contains(con.getName().split("\\.", -1)[0])) {
                    conversations += "true" + Main.SEPARATOR;
                } else {
                    conversations += "false" + Main.SEPARATOR;
                }
            }
        }
        if (conversations.length() == 0) {
            return "";
        }
        return conversations.substring(0, conversations.length() - 1);
    }
}
