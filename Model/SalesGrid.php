<?php

namespace JoshSpivey\SalesGrid\Model;

use JoshSpivey\SalesGrid\Api\Data\SalesGridInterface;
use JoshSpivey\SalesGrid\Helper\ConfigHelper;

class SalesGrid extends \Magento\Framework\Model\AbstractModel implements SalesGridInterface
{
    /** @var  ConfigHelper */
    protected $_config;

    public function __construct(ConfigHelper $config)
    {
        $this->_config = $config;

    }
    public function getGreetings()
    {
        return 'Greetings!';
    }

    public function getSampleText()
    {
        return $this->_config->getConfig('txt/textsample');
    }
}