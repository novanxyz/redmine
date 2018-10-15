class MetaHook  < Redmine::Hook::ViewListener

    def view_layouts_base_html_head(context = {})
        if context[:controller].controller_name == 'news' && context[:controller].action_name == 'show'
            if context[:request].params['id'] && context[:request].params['id'] =~ %r{^[0-9]+$}
                if news = News.find_by_id(context[:request].params['id'])
                    canonical_url = news_path(news, :only_path => false,
                                                    :protocol => Setting.protocol, :host => Setting.host_name)
                    '<link rel="canonical" href="'.html_safe + canonical_url + '" />'.html_safe
                end
            end
        elsif context[:controller].controller_name == 'messages' && context[:controller].action_name == 'show'
            if context[:request].params['id'] && context[:request].params['id'] =~ %r{^[0-9]+$}
                if message = Message.find_by_id(context[:request].params['id'])
                    canonical_url = url_for(:controller => 'messages', :action => 'show', :board_id => message.board, :id => message,
                                            :only_path => false, :protocol => Setting.protocol, :host => Setting.host_name)
                    '<link rel="canonical" href="'.html_safe + canonical_url + '" />'.html_safe
                end
            end
        end
    end

    render_on :view_issues_show_description_bottom, :partial => 'meta/issues'
    render_on :view_projects_show_sidebar_bottom,   :partial => 'meta/projects'
    render_on :view_welcome_index_left,             :partial => 'meta/welcome'

    render_on :view_news_show_left,                 :partial => 'meta/news'
    render_on :view_wiki_show_left,                 :partial => 'meta/wiki'
    render_on :view_messages_show_topic_bottom,     :partial => 'meta/topic'

    render_on :view_versions_show_bottom,           :partial => 'meta/versions'
    render_on :view_account_left_bottom,            :partial => 'meta/users'

end
