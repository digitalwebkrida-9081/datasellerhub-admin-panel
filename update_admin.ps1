# Update Admin Panel on Server

$Server = "root@46.202.141.158"
$RemotePath = "/var/www/admin-panel"

Write-Host "Connecting to $Server to update..."

ssh -t $Server "
    cd $RemotePath
    echo 'Pulling latest changes...'
    git pull origin main

    echo 'Installing dependencies...'
    npm install --legacy-peer-deps

    echo 'Rebuilding application...'
    npm run build

    echo 'Restarting PM2...'
    pm2 restart admin-panel
"

Write-Host "Update finished successfully!" 
