require_dependency 'news'

module MetaNewsPatch

    def self.included(base)
        base.send(:include, InstanceMethods)
        base.class_eval do
            unloadable
        end
    end

    module InstanceMethods

        def to_param
            permalink = title.parameterize
            permalink.empty? ? id.to_s : "#{id}-#{permalink}"
        end

    end

end
