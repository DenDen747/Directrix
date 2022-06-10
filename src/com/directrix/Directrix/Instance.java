package com.directrix.Directrix;

import com.denesgarda.Socketeer.Connection;

public class Instance {
    public final long ID;
    public final String username;
    public final Connection connection;

    public Instance(long ID, String username, Connection connection) {
        this.ID = ID;
        this.username = username;
        this.connection = connection;
    }
}
