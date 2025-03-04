function fetchGithubComments() {
  // configをPropertiesServiceから読み込む
  const scriptProperties = PropertiesService.getScriptProperties();
  const ACCESS_TOKEN = scriptProperties.getProperty('GITHUB_ACCESS_TOKEN');
  const OWNER = scriptProperties.getProperty('GITHUB_OWNER');
  const REPO = scriptProperties.getProperty('GITHUB_REPOSITORY');
  const DOC_ID = scriptProperties.getProperty('OUTPUT_DOC_ID');
  const USER = scriptProperties.getProperty('TARGET_USER');

  // Docsを取得
  const doc = DocumentApp.openById(DOC_ID);
  const body = doc.getBody();

  // GitHubのAPIエンドポイント
  const baseUrl = 'https://api.github.com';
  
  // PRの取得
  const prsUrl = `${baseUrl}/repos/${OWNER}/${REPO}/pulls?state=all&per_page=100`;
  const prsResponse = UrlFetchApp.fetch(prsUrl, {
    headers: {
      'Authorization': `token ${ACCESS_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  const prs = JSON.parse(prsResponse.getContentText());

  // 実行した日の前日のPRを取得する
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 1);
  startDate.setHours(0,0,0);
  const endDate = new Date();
  endDate.setDate(today.getDate() - 1);
  endDate.setHours(23,59,59);

  body.appendParagraph(Utilities.formatDate( startDate, 'Asia/Tokyo', 'yyyy/M/d'))
          .setHeading(DocumentApp.ParagraphHeading.HEADING3);

  // PRをフィルタリングして処理
  prs.forEach(pr => {
    const prCreatedAt = new Date(pr.created_at);
    
    if (pr.user.login === USER && 
        prCreatedAt >= startDate && 
        prCreatedAt <= endDate) {
      
      body.appendParagraph(`${pr.title}(${pr.html_url})`)
          .setHeading(DocumentApp.ParagraphHeading.HEADING4);
      
      // PRコメントの取得
      const prCommentsUrl = `${baseUrl}/repos/${OWNER}/${REPO}/pulls/${pr.number}/comments`;
      const prCommentsResponse = UrlFetchApp.fetch(prCommentsUrl, {
        headers: {
          'Authorization': `token ${ACCESS_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      // Issueコメントの取得
      const issueCommentsUrl = `${baseUrl}/repos/${OWNER}/${REPO}/issues/${pr.number}/comments`;
      const issueCommentsResponse = UrlFetchApp.fetch(issueCommentsUrl, {
        headers: {
          'Authorization': `token ${ACCESS_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const prComments = JSON.parse(prCommentsResponse.getContentText());
      const issueComments = JSON.parse(issueCommentsResponse.getContentText());

      // PRコメントの処理
      prComments.forEach(comment => {
        const commentDate = new Date(comment.created_at);
        const commentBody = comment.body
        const commentLogin = comment.user.login

        // コメント日時
        var comment_datetime_title = body.appendListItem("コメント日時");
        comment_datetime_title.setNestingLevel(2);
        var comment_datetime = body.appendListItem(commentDate.toLocaleString('ja-JP'));
        comment_datetime.setNestingLevel(3);

        // コメント内容
        var comment_title = body.appendListItem("コメント");
        comment_title.setNestingLevel(2);
        var comment = body.appendListItem(commentBody);
        comment.setNestingLevel(3);

        // コメント記載者
        var comment_author_title = body.appendListItem("コメント記載者");
        comment_author_title.setNestingLevel(2);
        var comment_author = body.appendListItem(commentLogin);
        comment_author.setNestingLevel(3);
      });

      // Issueコメントの処理
      issueComments.forEach(comment => {
        if (comment.user.login !== 'github-actions[bot]') {
          const commentDate = new Date(comment.created_at);
          const commentBody = comment.body;
          const commentLogin = comment.user.login;
          // コメント日時
          var comment_datetime_title = body.appendListItem("コメント日時");
          comment_datetime_title.setNestingLevel(2);
          var comment_datetime = body.appendListItem(commentDate.toLocaleString('ja-JP'));
          comment_datetime.setNestingLevel(3);

          // コメント内容
          var comment_title = body.appendListItem("コメント");
          comment_title.setNestingLevel(2);
          var comment = body.appendListItem(commentBody);
          comment.setNestingLevel(3);

          // コメント記載者
          var comment_author_title = body.appendListItem("コメント記載者");
          comment_author_title.setNestingLevel(2);
          var comment_author = body.appendListItem(commentLogin);
          comment_author.setNestingLevel(3);
        }
      });
    }
  });
}