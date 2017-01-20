<?php
namespace JoshSpivey\SalesGrid\Block\Adminhtml;

use Magento\Backend\Block\Template;
use JoshSpivey\SalesGrid\Helper\ConfigHelper;
use JoshSpivey\SalesGrid\Model\SalesGrid;

class CustomBlock extends Template
{
    /**
     * @var \JoshSpivey\SalesGrid\Helper\ConfigHelper
     */
    protected $_config;

    protected $_salesGridModel;

    /**
    * @param Context $context
    * @param array $data
    */
    public function __construct(
        Template\Context $context,
        SalesGrid $salesGridModel,
        ConfigHelper $config,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->_config = $config;
        $this->_salesGridModel = $salesGridModel;
    }

    /**
     * @return string
     */
    public function greet()
    {
        return $this->_salesGridModel->getGreetings();
    }

    public function getSampleText()
    {
        return $this->_salesGridModel->getSampleText();
    }

}
