require 'octokit'
require 'date'
require 'yaml'

# configファイルから設定を読み込む
config = YAML.load_file('config.yml')
ACCESS_TOKEN = config['github']['access_token']
owner = config['github']['owner']
repo = config['github']['repository']

client = Octokit::Client.new(access_token: ACCESS_TOKEN)

# 開始日と終了日を引数で受け取り、日付をTimeオブジェクトに変換 (例: "2024-02-01", "2024-02-10")
start_date = DateTime.parse(ARGV[0])
end_date = DateTime.parse(ARGV[1])
# JSTで比較するため、getlocalでJSTに変換
start_time = Time.new(start_date.year, start_date.month, start_date.day, 0, 0, 0).getlocal('+09:00')
end_time = Time.new(end_date.year, end_date.month, end_date.day, 23, 59, 59).getlocal('+09:00')

# 自分が作成した PR を取得し、期間内に作成されたものだけフィルタ
prs = client.pull_requests("#{owner}/#{repo}", per_page: 100, state: "all").select do |pr|
  created_at = pr.created_at.getlocal('+09:00')
  pr.user.login == 'watame' && created_at >= start_time && created_at <= end_time
end

prs.each do |pr|
  created_at = pr.created_at.getlocal('+09:00')
  puts "PR ##{pr.number}: #{pr.title} (#{created_at})"

  # PR のコメントを取得
  pr_comments = client.pull_request_comments("#{owner}/#{repo}", pr.number)
  issue_comments = client.issue_comments("#{owner}/#{repo}", pr.number)

  puts "-------PR Comments-------"
  pr_comments.each do |pr_comment|
    created_at = pr_comment.created_at.getlocal('+09:00')
    puts "- #{pr_comment.user.login}: #{pr_comment.body} (#{created_at})"
  end
  puts "-----Issue Comments------"
  issue_comments.each do |issue_comment|
    unless issue_comment.user.login == 'github-actions[bot]'
      created_at = issue_comment.created_at.getlocal('+09:00')
      puts "- #{issue_comment.user.login}: #{issue_comment.body} (#{created_at})"
    end
  end
  puts "========================="
end
