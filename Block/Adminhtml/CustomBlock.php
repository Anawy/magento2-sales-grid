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

    protected $orderInterface;


    /**
    * @param Context $context
    * @param array $data
    */
    public function __construct(
        Template\Context $context,
        SalesGrid $salesGridModel,
        ConfigHelper $config,
        array $data = [],
        \Magento\Sales\Api\Data\OrderInterface $orderInterface
    ) {
        parent::__construct($context, $data);
        $this->_config = $config;
        $this->_salesGridModel = $salesGridModel;
        $this->orderInterface = $orderInterface;
    }

    public function formatText($tmpRecord){
        $textFormatted = ucwords(str_replace('_', ' ', $tmpRecord));
        return [$tmpRecord => $textFormatted];
    }

    public function getOrderAttributes()
    {
        // var_dump($orderInterface->getConstants());
        $orderReflect = new \ReflectionClass($this->orderInterface);

        $formattedAttributes = array_map(array($this, 'formatText'), $orderReflect->getConstants());

        // return $fieldset->addField(
        //     'payment_types',
        //     'checkboxes',
        //     [
        //         'label' => __('Payment Types'),
        //         'name' => 'payment_types',
        //         'values' => [
        //             ['value' => '2','label' => 'Card'],
        //             ['value' => '3','label' => 'Cash'],
        //             ['value' => '4','label' => 'Prepaid']
        //         ],
        //     ]
        // );

        return $formattedAttributes;
    }

}
