package com.directrix.Directrix.util;

import com.denesgarda.Prop4j.data.PropertiesFile;

public class PropertiesUtil {
    public static String getPropertyNotNull(PropertiesFile p, String key, String defaultValue) {
        try {
            String value = p.getProperty(key);
            if (value == null || value.isBlank()) {
                p.setProperty(key, defaultValue);
                value = defaultValue;
            }
            return value;
        } catch (Exception e) {
            return null;
        }
    }
}
