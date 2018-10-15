# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html
#post '/send_issue/send', :controller => 'send_issue', :action => 'send'
post '/send_issue', :to => 'send_issue#index'

