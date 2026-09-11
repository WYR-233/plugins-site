# 部署肥鱼插件铺到服务器(plugins.wyr233.com)
# 用法: pwsh -File deploy.ps1
$ErrorActionPreference = 'Stop'
$root = 'G:\deepseek\workspace\plugins-site'
$server = 'root@121.41.27.59'
$zip = Join-Path $root '.preview\deploy.zip'

New-Item -ItemType Directory -Force -Path (Split-Path $zip) | Out-Null
Remove-Item $zip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path (Join-Path $root 'index.html'), (Join-Path $root 'assets'), (Join-Path $root 'data') -DestinationPath $zip -Force
Write-Host "打包完成: $((Get-Item $zip).Length) B"

scp -o StrictHostKeyChecking=no $zip "${server}:/tmp/plugins-site.zip"

$remote = @'
set -e
mkdir -p /var/www/plugins && cd /var/www/plugins
rm -rf assets data index.html
unzip -oq /tmp/plugins-site.zip
systemctl reload nginx
echo "deployed: $(date '+%F %T')"
curl -s -o /dev/null -w "https=%{http_code}\n" -m 15 https://plugins.wyr233.com/
echo "entries-in-json: $(grep -c '\"id\":' data/plugins.json || true)"
'@
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remote))
ssh -o StrictHostKeyChecking=no $server "echo $b64 | base64 -d | bash"
Write-Host '部署完成 → https://plugins.wyr233.com/'
