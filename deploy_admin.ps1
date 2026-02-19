# Deploy Admin Panel to Server

$Server = "root@46.202.141.158"
$RemotePath = "/var/www/admin-panel"
$RepoUrl = "https://github.com/digitalwebkrida-9081/datasellerhub-admin-panel.git"
$Port = 3002

Write-Host "Connecting to $Server to deploy..."

ssh -t $Server "
    # 1. Create directory if not exists
    mkdir -p /var/www
    cd /var/www

    # 2. Clone or Pull
    if [ ! -d 'admin-panel' ]; then
        echo 'Cloning repository...'
        git clone $RepoUrl admin-panel
    else
        echo 'Pulling latest changes...'
        cd admin-panel
        git pull origin main
    fi

    cd $RemotePath

    # 3. Create .env.local
    echo 'Creating .env.local...'
    echo 'NEXT_PUBLIC_API_URL=https://stagservice.datasellerhub.com' > .env.local
    echo 'NEXT_PUBLIC_ADMIN_PASSWORD=admin@3527' >> .env.local

    # 4. Install & Build
    echo 'Installing dependencies...'
    npm install --legacy-peer-deps

    echo 'Building application...'
    npm run build

    # 5. Start/Restart PM2
    echo 'Starting with PM2...'
    if pm2 list | grep -q 'admin-panel'; then
        pm2 restart admin-panel
    else
        pm2 start npm --name 'admin-panel' -- start -- -p $Port
    fi
    pm2 save
"

Write-Host "Deployment script finished."
