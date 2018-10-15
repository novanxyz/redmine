class ViewsIssuesHook < Redmine::Hook::ViewListener
  def view_issues_sidebar_issues_bottom(context={})
#    context[:controller].send(:render_to_string, {
#      :partial => 'send_email/issues_sidebar',
#      :locals => context }) +
    context[:controller].send(:render_to_string, {
      :partial => "send_issue/issue_sidebar",
      :locals => context })
  end
end
