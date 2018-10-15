# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html

get 'license', :to => 'license#index'
get 'license/get', :to => 'license#get'
post 'license/push', :to => 'license#push'
