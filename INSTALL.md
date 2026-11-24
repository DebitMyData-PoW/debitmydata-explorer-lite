# Installing the DebitMyData Lite Explorer

These steps run the explorer next to a DebitMyData node of your own: first on any computer to try
it, then as a service on an Ubuntu server, behind nginx with HTTPS. Below, `explorer.example.com`
stands for your own name.

## What you need

- [Go](https://go.dev/dl/) 1.18 or newer, to build it.
- A synced DebitMyData node ([DebitMyData Core](https://github.com/DebitMyData-PoW/DebitMyData-PoW-Core))
  with RPC turned on. In the node's `debitmydata.conf` (in its data folder, `~/.debitmydata` on
  Linux), with a user name and a long random password of your own:

  ```ini
  server=1
  txindex=1
  rpcuser=explorer
  rpcpassword=<a long random password>
  ```

  `txindex=1` lets the explorer show any transaction, not only those in the mempool or in the
  node's wallet. Restart the node after changing it (building the index takes a while the first
  time).

## Try it

```bash
git clone https://github.com/DebitMyData-PoW/debitmydata-explorer-lite.git
cd debitmydata-explorer-lite
go build

export DMD_RPC_USER=explorer
export DMD_RPC_PASSWORD='<the node's rpcpassword>'
./debitmydata-explorer
```

Then open <http://localhost:8001>. The explorer reads `templates/` and `static/` from the
folder it is started in, so start it from the repository folder (or copy those two folders
next to the program).

## Settings

The explorer is set up with environment variables. The node's login is never written in the
code.

| Variable | Default | What it is |
| --- | --- | --- |
| `DMD_RPC_USER` | (required) | The node's `rpcuser` |
| `DMD_RPC_PASSWORD` | (required) | The node's `rpcpassword` |
| `DMD_RPC_URL` | `http://127.0.0.1:18557/` | The node's RPC address (18557 is the DebitMyData mainnet RPC port) |
| `DMD_EXPLORER_LISTEN` | `:8001` | Where the explorer listens, e.g. `127.0.0.1:8001` behind a web server |

## On a server

1. **The program**, in its own folder and under its own user (on Ubuntu, `sudo apt-get install -y
   golang-go git` gives Go and git):

   ```bash
   sudo useradd --system --no-create-home explorer
   sudo git clone https://github.com/DebitMyData-PoW/debitmydata-explorer-lite.git /opt/debitmydata-lite-explorer
   cd /opt/debitmydata-lite-explorer && sudo go build
   ```

2. **Its settings.** [`deploy/explorer.env.example`](deploy/explorer.env.example) shows the
   settings file it reads; put the node's RPC user and password in it, and make it listen on this
   server only (`DMD_EXPLORER_LISTEN=127.0.0.1:8001`):

   ```bash
   sudo cp deploy/explorer.env.example /etc/debitmydata-explorer.env
   sudo nano /etc/debitmydata-explorer.env
   sudo chmod 600 /etc/debitmydata-explorer.env
   ```

3. **The service.** [`deploy/debitmydata-explorer.service`](deploy/debitmydata-explorer.service)
   runs it from `/opt/debitmydata-lite-explorer` as the `explorer` user:

   ```bash
   sudo cp deploy/debitmydata-explorer.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now debitmydata-explorer
   systemctl status debitmydata-explorer
   ```

4. **nginx with HTTPS.** Point your name to the server, then pass it to the explorer:

   ```bash
   sudo apt-get install -y nginx certbot python3-certbot-nginx
   sudo tee /etc/nginx/sites-available/explorer.example.com > /dev/null <<'EOF'
   server {
       listen 80;
       listen [::]:80;
       server_name explorer.example.com;

       location / {
           proxy_pass http://127.0.0.1:8001;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   EOF
   sudo ln -s /etc/nginx/sites-available/explorer.example.com /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d explorer.example.com
   ```

   Behind Cloudflare (proxied) instead, use a Cloudflare origin certificate on port 443 and the
   encryption mode **Full (strict)**.

5. **Check** `https://explorer.example.com`: the latest blocks appear, and a block, a transaction
   and an address open.

**Keep the node's RPC private.** Never open its RPC port to the internet. If the node runs on
another machine, allow only the explorer's address (`rpcallowip`) or connect them through a
private network.

## Updating

```bash
cd /opt/debitmydata-lite-explorer && sudo git pull && sudo go build
sudo systemctl restart debitmydata-explorer
```
