Redmine::Plugin.register :vardion_license do
  name 'Vardion License plugin'
  author 'Novan Firmansyah <novanxyz@gmail.com>'
  description 'This is a plugin for Redmine'
  version '0.0.1'
  url 'http://example.com/path/to/plugin'
  author_url 'http://example.com/about'

  menu :project_menu, :polls, { :controller => 'license', :action => 'index' }, :caption => 'License', :after => :settings, :param => :project_id
end
