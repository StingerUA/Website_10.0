git remote -v | Out-File -Encoding utf8 remote_info.txt
git rev-parse HEAD | Out-File -Encoding utf8 local_head.txt
git ls-remote origin main | Out-File -Encoding utf8 remote_head.txt
Get-ChildItem .github/workflows | Select-Object Name | Out-File -Encoding utf8 workflows_list.txt
