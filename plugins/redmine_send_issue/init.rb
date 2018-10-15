require_dependency 'send_issue_hook_listener'
Redmine::Plugin.register :redmine_send_issue do
  name 'Redmine Send Issue plugin'
  author 'Novan Firmansyah'
  description 'This plugin enable user to send issue to external email from sidebar'
  version '0.0.1'
  url 'http://example.com/path/to/plugin'
  author_url 'http://example.com/about'

  permission :send_issue , :send_issue => :send


end
